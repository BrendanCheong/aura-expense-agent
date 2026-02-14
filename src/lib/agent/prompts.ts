/**
 * Prompt templates for the AI agent.
 *
 * Will be implemented in FEAT-005 (AI Agent).
 */

export const SYSTEM_PROMPT = `You are Aura, an AI expense management assistant.
Your job is to extract expense information from emails and categorize transactions.`;

export const EXTRACTION_PROMPT = `Extract expense details from the following email content.
Return structured data with: amount, vendor, description, date.`;

export const CATEGORIZATION_PROMPT = `Given the following expense details, determine the most appropriate category.`;
