"use server";

import { notFound } from "next/navigation";

// Feature-flag admin capability is deferred. Every server action rejects
// with notFound() so no direct POST to a server-action endpoint (even one
// referenced by a client bundle cached before this deploy) can mutate
// flag state. Full implementations are preserved in git history — restore
// from the commit that introduced this stub and swap the session check to
// DTEC.SYSADMIN when re-enabling.

export async function createFlag(_formData: FormData): Promise<void> {
  notFound();
}

export async function deleteFlag(_flagName: string): Promise<void> {
  notFound();
}

export async function setFlagState(
  _flagName: string,
  _newState: "off" | "canary" | "on",
): Promise<void> {
  notFound();
}

export async function enrollUserByEmail(
  _flagName: string,
  _formData: FormData,
): Promise<void> {
  notFound();
}

export async function enrollNocUsers(
  _flagName: string,
  _formData: FormData,
): Promise<void> {
  notFound();
}

export async function unenrollUser(_flagName: string, _userId: string): Promise<void> {
  notFound();
}
