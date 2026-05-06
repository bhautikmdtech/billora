import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

export const InviteEmail = ({
  orgName,
  role,
  inviterName,
  token,
}: {
  orgName: string;
  role: string;
  inviterName: string;
  token: string;
}) => {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  return (
    <Html>
      <Head />
      <Preview>Join {orgName} on Billora ERP</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-10 px-5">
            <Heading className="text-2xl font-bold text-gray-900">
              You've been invited!
            </Heading>
            <Text className="text-gray-700 text-lg">
              {inviterName} has invited you to join <strong>{orgName}</strong> as a <strong>{role}</strong>.
            </Text>
            <Section className="py-5">
              <Link
                href={inviteUrl}
                className="bg-black text-white px-6 py-3 rounded-md font-bold text-center inline-block"
              >
                Accept Invitation
              </Link>
            </Section>
            <Text className="text-gray-500 text-sm">
              This invite will expire in 48 hours.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteEmail;
