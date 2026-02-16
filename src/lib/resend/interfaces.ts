/**
 * IEmailProvider — Interface for fetching received email content.
 *
 * Abstracts the Resend SDK behind a DI-friendly interface so that:
 * - WebhookService depends on the interface, not the Resend SDK
 * - Tests can inject a mock provider returning fixture data
 * - The real implementation delegates to resend.emails.receiving.get()
 *
 * @see ADR-007 (Dependency Injection)
 * @see FEAT-004 (Webhook Handler)
 */

/**
 * Normalized received email structure.
 * Maps from Resend's API response to our domain model.
 */
export interface ReceivedEmail {
  id: string;
  to: string[];
  from: string;
  subject: string;
  html: string | null;
  text: string | null;
  createdAt: string;
}

/**
 * Interface for fetching received email content from an email provider.
 */
export interface IEmailProvider {
  /**
   * Fetch a received email by its ID.
   * Returns null if the email is not found.
   */
  getReceivedEmail(emailId: string): Promise<ReceivedEmail | null>;
}
