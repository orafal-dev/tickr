import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

import type { EmailVerificationEmailProps } from "./email-verification.types.ts";

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525f7f",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  width: "fit-content",
};

const fallback = {
  ...paragraph,
  fontSize: "12px",
  color: "#8898aa",
};

const linkText = {
  ...paragraph,
  fontSize: "12px",
  wordBreak: "break-all" as const,
};

const EmailVerificationEmail = ({ confirmUrl }: EmailVerificationEmailProps) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>Confirm your email address for Tickr.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: "0 48px" }}>
            <Text style={paragraph}>
              Thanks for signing up. Confirm your email address to finish
              setting up your account. This link can only be used once.
            </Text>
            <Button href={confirmUrl} style={button}>
              Confirm email
            </Button>
            <Text style={fallback}>
              If the button does not work, copy and paste this link into your
              browser:
            </Text>
            <Text style={linkText}>{confirmUrl}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

EmailVerificationEmail.PreviewProps = {
  confirmUrl: "https://example.com/api/auth/verify-email?token=demo&callbackURL=%2F",
} satisfies EmailVerificationEmailProps;

export default EmailVerificationEmail;
