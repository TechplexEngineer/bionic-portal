import { eq } from "drizzle-orm";
import * as table from "./db/schema";
import type { DbInstance } from "./db";

const { env } = await import("$env/dynamic/private");
const CLIENT_ID = env.QUICKBOOKS_CLIENT_ID;
const CLIENT_SECRET = env.QUICKBOOKS_CLIENT_SECRET;
const COMPANY_ID = env.QUICKBOOKS_COMPANY_ID;
const API_BASE = env.QUICKBOOKS_API_BASE || "https://sandbox-quickbooks.api.intuit.com/v3";
const REDIRECT_URI = "http://localhost:5173/oauth/quickbooks/callback";

if (typeof CLIENT_ID !== 'string') {
    console.log(`Missing expected API key (QUICKBOOKS_CLIENT_ID) in environment.`);
}

if (typeof CLIENT_SECRET !== 'string') {
    console.log(`Missing expected API key (QUICKBOOKS_CLIENT_SECRET) in environment.`);
}

if (typeof COMPANY_ID !== 'string') {
    console.log(`Missing expected API key (QUICKBOOKS_COMPANY_ID) in environment.`);
}

if (typeof API_BASE !== 'string') {
    console.log(`Missing expected API key (QUICKBOOKS_API_BASE) in environment.`);
}

if (typeof REDIRECT_URI !== 'string') {
    console.log(`Missing expected API key (QUICKBOOKS_REDIRECT_URI) in environment.`);
}

interface TokenInfo {
    access_token: string;
    refresh_token: string;
    expires_at: number; // timestamp in ms
}

export async function getAuthorizationUrl() {
	if (typeof CLIENT_ID !== "string") {
		throw new Error("QuickBooks client ID is not configured");
	}


    const url = new URL("https://appcenter.intuit.com/connect/oauth2");
    url.searchParams.append("client_id", CLIENT_ID);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", "com.intuit.quickbooks.accounting");
    url.searchParams.append("redirect_uri", REDIRECT_URI);
    url.searchParams.append("state", "authenticated"); // In a real app, use a CSRF token
    console.log("Authorization URL: ", url.toString());
    return url.toString();
}

export async function exchangeCodeForToken(code: string, realmId: string, db: DbInstance) {
    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
    }

    const data = await response.json() as any;
    const tokenInfo: TokenInfo = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000
    };

    await saveTokens(db, tokenInfo, realmId);
    return tokenInfo;
}

async function refreshTokens(db: DbInstance, refreshToken: string) {
    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json() as any;
    const tokenInfo: TokenInfo = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000
    };

    await saveTokens(db, tokenInfo);
    return tokenInfo;
}

async function saveTokens(db: DbInstance, tokens: TokenInfo, realmId?: string) {
    await db.insert(table.kvStore).values({
        key: "quickbooks_tokens",
        value: JSON.stringify(tokens)
    }).onConflictDoUpdate({
        target: table.kvStore.key,
        set: { value: JSON.stringify(tokens), updatedAt: new Date() }
    });

    if (realmId) {
        await db.insert(table.kvStore).values({
            key: "quickbooks_realm_id",
            value: realmId
        }).onConflictDoUpdate({
            target: table.kvStore.key,
            set: { value: realmId, updatedAt: new Date() }
        });
    }
}

async function getTokens(db: DbInstance): Promise<TokenInfo | null> {
    const [row] = await db.select().from(table.kvStore).where(eq(table.kvStore.key, "quickbooks_tokens"));
    if (!row) return null;
    return JSON.parse(row.value);
}

async function getRealmId(db: DbInstance): Promise<string | null> {
    const [row] = await db.select().from(table.kvStore).where(eq(table.kvStore.key, "quickbooks_realm_id"));
    if (row) return row.value;
    return COMPANY_ID || null;
}

async function getAuthenticatedClient(db: DbInstance) {
    let tokens = await getTokens(db);
    if (!tokens) {
        throw new Error("AUTH_REQUIRED");
    }

    if (Date.now() >= tokens.expires_at - 60000) { // Refresh 1 minute before expiry
        tokens = await refreshTokens(db, tokens.refresh_token);
    }

    const realmId = await getRealmId(db);
    if (!realmId) {
        throw new Error("REALM_ID_REQUIRED");
    }

    return {
        access_token: tokens.access_token,
        realmId,
        request: async (path: string, options: RequestInit = {}) => {
            const url = `${API_BASE}/company/${realmId}${path}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${tokens!.access_token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                let errorMessage = `QuickBooks API error (${response.status})`;
                try {
                    const errorData = await response.json() as any;
                    if (errorData.Fault && errorData.Fault.Error && errorData.Fault.Error.length > 0) {
                        const qbError = errorData.Fault.Error[0];
                        errorMessage = `QuickBooks Error: ${qbError.Message} (${qbError.Detail})`;
                    } else {
                        errorMessage += `: ${JSON.stringify(errorData)}`;
                    }
                } catch (e) {
                    const text = await response.text();
                    errorMessage += `: ${text}`;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        }
    };
}

export async function findCustomerByEmail(db: DbInstance, email: string) {
    const client = await getAuthenticatedClient(db);
    const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`;
    const data = (await client.request(`/query?query=${encodeURIComponent(query)}`)) as {
        QueryResponse: { Customer?: any[] };
    };
    const customers = data?.QueryResponse?.Customer || [];
    return customers.length ? customers[0] : null;
}

export async function findCustomerByName(db: DbInstance, name: string) {
    const client = await getAuthenticatedClient(db);
    const query = `SELECT * FROM Customer WHERE DisplayName = '${name}'`;
    const data = (await client.request(`/query?query=${encodeURIComponent(query)}`)) as {
        QueryResponse: { Customer?: any[] };
    };
    const customers = data?.QueryResponse?.Customer || [];
    return customers.length ? customers[0] : null;
}

export async function createCustomer(db: DbInstance, name: string, email: string) {
    const client = await getAuthenticatedClient(db);
    const body = {
        DisplayName: name,
        PrimaryEmailAddr: email ? { Address: email } : undefined
    };
    return (await client.request("/customer?minorversion=75", {
        method: "POST",
        body: JSON.stringify(body)
    })) as { Customer: any };
}

export async function findItemByName(db: DbInstance, name: string) {
    const client = await getAuthenticatedClient(db);
    const query = `SELECT * FROM Item WHERE Name = '${name}'`;
    const data = (await client.request(`/query?query=${encodeURIComponent(query)}`)) as {
        QueryResponse: { Item?: any[] };
    };
    const items = data?.QueryResponse?.Item || [];
    return items.length ? items[0] : null;
}

export async function createInvoice(db: DbInstance, customerId: string, items: any[]) {
    const client = await getAuthenticatedClient(db);
    const body = {
        CustomerRef: { value: customerId },
        Line: items,
        AllowOnlinePayment: true,
        AllowOnlineCreditCardPayment: true,
        AllowOnlineACHPayment: true,
        PaymentMethodRef: { value: "CreditCard" }
    };
    return (await client.request("/invoice?minorversion=75", {
        method: "POST",
        body: JSON.stringify(body)
    })) as { Invoice: any };
}

export async function getInvoice(db: DbInstance, invoiceId: string) {
    const client = await getAuthenticatedClient(db);
    // include=invoiceLink is required to get the payment link
    const path = `/invoice/${invoiceId}?minorversion=75&include=invoiceLink`;
    const data = await client.request(path) as { Invoice: any };
    return data?.Invoice || null;
}

export async function findIncomeAccountByName(db: DbInstance, name: string) {
    const client = await getAuthenticatedClient(db);
    const query = `SELECT * FROM Account WHERE AccountType = 'Income' AND FullyQualifiedName = '${name}'`;
    const data = (await client.request(`/query?query=${encodeURIComponent(query)}`)) as {
        QueryResponse: { Account?: any[] };
    };
    const accounts = data?.QueryResponse?.Account || [];
    return accounts.length ? accounts[0] : null;
}

export async function createItem(db: DbInstance, name: string, description: string, incomeAccountId: string) {
    const client = await getAuthenticatedClient(db);
    const body = {
        Name: name,
        Description: description,
        Active: true,
        Type: "Service",
        IncomeAccountRef: {
            value: incomeAccountId
        }
    };
    return (await client.request("/item?minorversion=75", {
        method: "POST",
        body: JSON.stringify(body)
    })) as { Item: any };
}


export async function getInvoicePaymentLink(db: DbInstance, invoiceId: string) {
    const invoice = await getInvoice(db, invoiceId);
    return invoice?.InvoiceLink || null;
}
