"use server";

// @ts-ignore
import store from "app-store-scraper";

export async function getIosAppById({ id }: { id: string }) {
    return await store.app({ id });
}