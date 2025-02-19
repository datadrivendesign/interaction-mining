"use server";

// @ts-ignore
import store from "app-store-scraper";

export async function getIosAppById({ appId }: { appId: string }) {
    return await store.app({ appId });
}