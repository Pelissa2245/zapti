--
-- PostgreSQL database dump
--

\restrict qQYXbuJIgebf8OZ9ejx7xxZRBzFdMZf5EZfqwzyDdgKFmatJEgNLLg14zoCDwoN

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "tenantId" text,
    "userId" text,
    action text NOT NULL,
    "entityType" text,
    "entityId" text,
    description text NOT NULL,
    metadata text DEFAULT '{}'::text NOT NULL,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: Automation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Automation" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    schedule text NOT NULL,
    action text NOT NULL,
    target text,
    conditions text DEFAULT '[]'::text NOT NULL,
    settings text DEFAULT '{}'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    tags text DEFAULT ''::text,
    "nextRunAt" timestamp(3) without time zone,
    "executionCount" integer DEFAULT 0 NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Automation" OWNER TO postgres;

--
-- Name: AutomationExecution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AutomationExecution" (
    id text NOT NULL,
    "automationId" text NOT NULL,
    "tenantId" text NOT NULL,
    "triggerData" text NOT NULL,
    "triggerType" text DEFAULT 'MANUAL'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    output text,
    error text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "triggeredBy" text
);


ALTER TABLE public."AutomationExecution" OWNER TO postgres;

--
-- Name: Backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Backup" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "filePath" text,
    "fileSize" integer,
    error text,
    metadata text DEFAULT '{}'::text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdBy" text NOT NULL
);


ALTER TABLE public."Backup" OWNER TO postgres;

--
-- Name: Contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "instanceId" text NOT NULL,
    name text,
    "phoneNumber" text NOT NULL,
    email text,
    "profilePicUrl" text,
    "isBlocked" boolean DEFAULT false NOT NULL,
    tags text DEFAULT '[]'::text NOT NULL,
    metadata text DEFAULT '{}'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Contact" OWNER TO postgres;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "contactId" text NOT NULL,
    "instanceId" text NOT NULL,
    "assignedTo" text,
    "teamId" text,
    status text DEFAULT 'OPEN'::text NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    "unreadCount" integer DEFAULT 0 NOT NULL,
    "lastMessage" text,
    "lastMessageAt" timestamp(3) without time zone,
    "lastReadAt" timestamp(3) without time zone,
    "snoozedUntil" timestamp(3) without time zone,
    tags text DEFAULT '[]'::text NOT NULL,
    metadata text DEFAULT '{}'::text NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "closedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO postgres;

--
-- Name: Flow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Flow" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "triggerType" text NOT NULL,
    "triggerConfig" text NOT NULL,
    nodes text NOT NULL,
    edges text NOT NULL,
    settings text DEFAULT '{}'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Flow" OWNER TO postgres;

--
-- Name: FlowExecution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FlowExecution" (
    id text NOT NULL,
    "flowId" text NOT NULL,
    "tenantId" text NOT NULL,
    "triggerData" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "currentNodeId" text,
    context text DEFAULT '{}'::text NOT NULL,
    error text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "triggeredBy" text
);


ALTER TABLE public."FlowExecution" OWNER TO postgres;

--
-- Name: FlowExecutionStep; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FlowExecutionStep" (
    id text NOT NULL,
    "executionId" text NOT NULL,
    "nodeId" text NOT NULL,
    "nodeType" text NOT NULL,
    input text NOT NULL,
    output text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    error text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public."FlowExecutionStep" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "conversationId" text NOT NULL,
    "instanceId" text NOT NULL,
    "contactId" text NOT NULL,
    "senderId" text,
    type text NOT NULL,
    direction text NOT NULL,
    content text,
    "mediaUrl" text,
    "mediaType" text,
    "mediaSize" integer,
    "mediaCaption" text,
    status text DEFAULT 'SENT'::text NOT NULL,
    "externalId" text,
    "repliedToId" text,
    "templateParams" text,
    "interactiveButtons" text,
    "interactiveList" text,
    "errorMessage" text,
    "sentAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: MessageReaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MessageReaction" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    emoji text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageReaction" OWNER TO postgres;

--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetToken" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text NOT NULL,
    "refreshToken" text NOT NULL,
    "userAgent" text,
    ip text,
    "deviceName" text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "lastActiveAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Team" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Team" OWNER TO postgres;

--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    settings text DEFAULT '{}'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    plan text DEFAULT 'free'::text,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO postgres;

--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "conversationId" text,
    "contactId" text,
    "categoryId" text,
    title text NOT NULL,
    description text,
    status text DEFAULT 'OPEN'::text NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    "assignedTo" text,
    "teamId" text,
    "dueAt" timestamp(3) without time zone,
    "slaHours" integer,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "closedAt" timestamp(3) without time zone,
    "closedBy" text,
    tags text DEFAULT '[]'::text NOT NULL,
    metadata text DEFAULT '{}'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO postgres;

--
-- Name: TicketAttachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TicketAttachment" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "ticketId" text NOT NULL,
    "commentId" text,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileType" text NOT NULL,
    "fileSize" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketAttachment" OWNER TO postgres;

--
-- Name: TicketCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TicketCategory" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "parentId" text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "slaHours" integer,
    "slaResponseHours" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TicketCategory" OWNER TO postgres;

--
-- Name: TicketComment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TicketComment" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "ticketId" text NOT NULL,
    "authorId" text NOT NULL,
    content text NOT NULL,
    "isInternal" boolean DEFAULT false NOT NULL,
    "editedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TicketComment" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    "passwordHash" text NOT NULL,
    "avatarUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isSuperadmin" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text,
    "twoFactorRecoveryCodes" text DEFAULT '[]'::text NOT NULL,
    "onboardingCompleted" boolean DEFAULT false NOT NULL,
    language text DEFAULT 'pt-BR'::text,
    timezone text DEFAULT 'America/Sao_Paulo'::text,
    "notificationPreferences" text DEFAULT '{}'::text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserTeam; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserTeam" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "teamId" text NOT NULL,
    "userTenantId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserTeam" OWNER TO postgres;

--
-- Name: UserTenant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserTenant" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text NOT NULL,
    role text DEFAULT 'AGENT'::text NOT NULL,
    permissions text DEFAULT '[]'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserTenant" OWNER TO postgres;

--
-- Name: WhatsAppInstance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WhatsAppInstance" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "phoneNumber" text,
    "webhookUrl" text,
    "webhookSecret" text,
    "qrCode" text,
    "encryptionKey" text NOT NULL,
    settings text DEFAULT '{}'::text NOT NULL,
    status text DEFAULT 'DISCONNECTED'::text NOT NULL,
    "lastConnected" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WhatsAppInstance" OWNER TO postgres;

--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "tenantId", "userId", action, "entityType", "entityId", description, metadata, ip, "userAgent", "createdAt") FROM stdin;
cmuvw5rtp00068o4zuzwmzv0s	\N	\N	BOOTSTRAP_COMPLETED	\N	\N	BOOTSTRAP_COMPLETED - cmuvw5rin00018o4zb8suufb6	{"userId":"cmuvw5rin00018o4zb8suufb6","tenantId":"cmuvw5rir00038o4zskyrpzp0","ip":"192.168.1.141","userAgent":"curl/8.8.0"}	\N	\N	2026-10-05 23:39:08.701
cmuvw8bno00078o4zlfab7oij	\N	\N	LOGIN_SUCCESS	\N	\N	LOGIN_SUCCESS - cmuvw5rin00018o4zb8suufb6	{"userId":"cmuvw5rin00018o4zb8suufb6","tenantId":"cmuvw5rir00038o4zskyrpzp0","ip":"192.168.1.141","userAgent":"curl/8.8.0"}	\N	\N	2026-10-05 23:41:07.716
cmuvwi1bc00088o4zdwxtzx8u	\N	\N	LOGIN_SUCCESS	\N	\N	LOGIN_SUCCESS - cmuvw5rin00018o4zb8suufb6	{"userId":"cmuvw5rin00018o4zb8suufb6","tenantId":"cmuvw5rir00038o4zskyrpzp0","ip":"192.168.1.141","userAgent":"curl/8.8.0"}	\N	\N	2026-10-05 23:48:40.873
cmuvwn17100098o4zackzs491	\N	\N	LOGIN_SUCCESS	\N	\N	LOGIN_SUCCESS - cmuvw5rin00018o4zb8suufb6	{"userId":"cmuvw5rin00018o4zb8suufb6","tenantId":"cmuvw5rir00038o4zskyrpzp0","ip":"192.168.1.141","userAgent":"curl/8.8.0"}	\N	\N	2026-10-05 23:52:33.997
cmuw0ufty000a8o4zmy1zeo5x	\N	\N	LOGIN_FAILED	\N	\N	LOGIN_FAILED - matheus.b.pelissari@gmail.com	{"email":"matheus.b.pelissari@gmail.com","reason":"user_not_found","ip":"172.24.0.4","userAgent":"node"}	\N	\N	2026-10-06 01:50:18.005
\.


--
-- Data for Name: Automation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Automation" (id, "tenantId", name, description, schedule, action, target, conditions, settings, "isActive", tags, "nextRunAt", "executionCount", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AutomationExecution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AutomationExecution" (id, "automationId", "tenantId", "triggerData", "triggerType", status, output, error, "startedAt", "completedAt", "triggeredBy") FROM stdin;
\.


--
-- Data for Name: Backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Backup" (id, "tenantId", type, status, "filePath", "fileSize", error, metadata, "startedAt", "completedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Contact" (id, "tenantId", "instanceId", name, "phoneNumber", email, "profilePicUrl", "isBlocked", tags, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Conversation" (id, "tenantId", "contactId", "instanceId", "assignedTo", "teamId", status, priority, "unreadCount", "lastMessage", "lastMessageAt", "lastReadAt", "snoozedUntil", tags, metadata, "closedAt", "closedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Flow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Flow" (id, "tenantId", name, description, "triggerType", "triggerConfig", nodes, edges, settings, "isActive", version, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FlowExecution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FlowExecution" (id, "flowId", "tenantId", "triggerData", status, "currentNodeId", context, error, "startedAt", "completedAt", "triggeredBy") FROM stdin;
\.


--
-- Data for Name: FlowExecutionStep; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FlowExecutionStep" (id, "executionId", "nodeId", "nodeType", input, output, status, error, "startedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "tenantId", "conversationId", "instanceId", "contactId", "senderId", type, direction, content, "mediaUrl", "mediaType", "mediaSize", "mediaCaption", status, "externalId", "repliedToId", "templateParams", "interactiveButtons", "interactiveList", "errorMessage", "sentAt", "deliveredAt", "readAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MessageReaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MessageReaction" (id, "tenantId", "messageId", "userId", emoji, "createdAt") FROM stdin;
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PasswordResetToken" (id, "userId", "tokenHash", "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "userId", "tenantId", "refreshToken", "userAgent", ip, "deviceName", status, "expiresAt", "lastActiveAt", "revokedAt", "createdAt") FROM stdin;
0ab4db8b9d7fd9cbe890d57d5dde48651b5f8bbed12c0a54b8f7ce8db45ca7f5	cmuvw5rin00018o4zb8suufb6	cmuvw5rir00038o4zskyrpzp0	56d6f22874292abf6b3b2e9f9688f05b72dc56079fd03c52c9025db95e9db5ff	curl/8.8.0	192.168.1.141	\N	ACTIVE	2026-11-04 23:39:08.409	2026-10-05 23:39:19.574	\N	2026-10-05 23:39:08.473
70a4436f229c2cd9020697c63196c8ffffb1c63d6918f2f7cc0ba03e24cb3461	cmuvw5rin00018o4zb8suufb6	cmuvw5rir00038o4zskyrpzp0	f220e84659b81d7ca672d3020c82bbdc7cbe4b0331f8aff76dcc3a84f2b7f402	curl/8.8.0	192.168.1.141	\N	ACTIVE	2026-10-12 23:41:07.558	2026-10-05 23:41:33.512	\N	2026-10-05 23:41:07.559
93a548086da88a3027105f714f4921313c4bc5eaf8eecd58bb4df90c0f56011f	cmuvw5rin00018o4zb8suufb6	cmuvw5rir00038o4zskyrpzp0	faff335419027b910e81ffbe87bd6285458d0eaf213b933adea544c35d09ade7	curl/8.8.0	192.168.1.141	\N	ACTIVE	2026-10-12 23:48:40.691	2026-10-05 23:48:52.489	\N	2026-10-05 23:48:40.692
9f0e5ce8bba41e06ae4ab952e7c42b36bf0fe62559acf86b26e76f1af7b0d670	cmuvw5rin00018o4zb8suufb6	cmuvw5rir00038o4zskyrpzp0	f01b4071bb65946c0962ebe18dd58dcf820ed00d6bd1b1b4964e242374949c2d	curl/8.8.0	192.168.1.141	\N	ACTIVE	2026-10-12 23:52:33.761	2026-10-06 00:01:54.779	\N	2026-10-05 23:52:33.762
\.


--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Team" (id, "tenantId", name, description, color, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tenant" (id, name, settings, status, plan, "ownerId", "createdAt", "updatedAt") FROM stdin;
cmuvw5rir00038o4zskyrpzp0	Empresa Teste	{"fantasyName":"Teste Ltda","timezone":"America/Sao_Paulo","country":"BR","currency":"BRL","logoUrl":""}	ACTIVE	free	cmuvw5rin00018o4zb8suufb6	2026-10-05 23:39:08.307	2026-10-05 23:39:08.307
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ticket" (id, "tenantId", "conversationId", "contactId", "categoryId", title, description, status, priority, "assignedTo", "teamId", "dueAt", "slaHours", "resolvedAt", "resolvedBy", "closedAt", "closedBy", tags, metadata, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: TicketAttachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TicketAttachment" (id, "tenantId", "ticketId", "commentId", "fileName", "fileUrl", "fileType", "fileSize", "createdAt") FROM stdin;
\.


--
-- Data for Name: TicketCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TicketCategory" (id, "tenantId", name, description, color, "parentId", "order", "isActive", "slaHours", "slaResponseHours", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TicketComment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TicketComment" (id, "tenantId", "ticketId", "authorId", content, "isInternal", "editedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, name, "passwordHash", "avatarUrl", "isActive", "isSuperadmin", "lastLoginAt", "twoFactorEnabled", "twoFactorSecret", "twoFactorRecoveryCodes", "onboardingCompleted", language, timezone, "notificationPreferences", "createdAt", "updatedAt") FROM stdin;
cmuvw5rin00018o4zb8suufb6	admin@teste.com	Admin Teste	$2a$12$8GY.uLDyJULZF5F/IB6x2OZsZUBOcTQ8aNIUdl4BGC2iWcBXovbdq	\N	t	t	2026-10-05 23:52:33.956	f	\N	[]	t	pt-BR	America/Sao_Paulo	{}	2026-10-05 23:39:08.303	2026-10-05 23:52:33.957
\.


--
-- Data for Name: UserTeam; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserTeam" (id, "userId", "teamId", "userTenantId", "createdAt") FROM stdin;
\.


--
-- Data for Name: UserTenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserTenant" (id, "userId", "tenantId", role, permissions, "joinedAt", "updatedAt") FROM stdin;
cmuvw5riu00058o4zw1sy4xq6	cmuvw5rin00018o4zb8suufb6	cmuvw5rir00038o4zskyrpzp0	OWNER	["*"]	2026-10-05 23:39:08.31	2026-10-05 23:39:08.31
\.


--
-- Data for Name: WhatsAppInstance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WhatsAppInstance" (id, "tenantId", name, "phoneNumber", "webhookUrl", "webhookSecret", "qrCode", "encryptionKey", settings, status, "lastConnected", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AutomationExecution AutomationExecution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AutomationExecution"
    ADD CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY (id);


--
-- Name: Automation Automation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Automation"
    ADD CONSTRAINT "Automation_pkey" PRIMARY KEY (id);


--
-- Name: Backup Backup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Backup"
    ADD CONSTRAINT "Backup_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: FlowExecutionStep FlowExecutionStep_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowExecutionStep"
    ADD CONSTRAINT "FlowExecutionStep_pkey" PRIMARY KEY (id);


--
-- Name: FlowExecution FlowExecution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowExecution"
    ADD CONSTRAINT "FlowExecution_pkey" PRIMARY KEY (id);


--
-- Name: Flow Flow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Flow"
    ADD CONSTRAINT "Flow_pkey" PRIMARY KEY (id);


--
-- Name: MessageReaction MessageReaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: TicketAttachment TicketAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketAttachment"
    ADD CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY (id);


--
-- Name: TicketCategory TicketCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketCategory"
    ADD CONSTRAINT "TicketCategory_pkey" PRIMARY KEY (id);


--
-- Name: TicketComment TicketComment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: UserTeam UserTeam_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserTeam"
    ADD CONSTRAINT "UserTeam_pkey" PRIMARY KEY (id);


--
-- Name: UserTenant UserTenant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserTenant"
    ADD CONSTRAINT "UserTenant_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WhatsAppInstance WhatsAppInstance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WhatsAppInstance"
    ADD CONSTRAINT "WhatsAppInstance_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_entityId_idx" ON public."AuditLog" USING btree ("entityId");


--
-- Name: AuditLog_entityType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_entityType_idx" ON public."AuditLog" USING btree ("entityType");


--
-- Name: AuditLog_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_tenantId_idx" ON public."AuditLog" USING btree ("tenantId");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: AutomationExecution_automationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutomationExecution_automationId_idx" ON public."AutomationExecution" USING btree ("automationId");


--
-- Name: AutomationExecution_startedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutomationExecution_startedAt_idx" ON public."AutomationExecution" USING btree ("startedAt");


--
-- Name: AutomationExecution_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutomationExecution_status_idx" ON public."AutomationExecution" USING btree (status);


--
-- Name: AutomationExecution_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutomationExecution_tenantId_idx" ON public."AutomationExecution" USING btree ("tenantId");


--
-- Name: AutomationExecution_triggeredBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutomationExecution_triggeredBy_idx" ON public."AutomationExecution" USING btree ("triggeredBy");


--
-- Name: Automation_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Automation_createdBy_idx" ON public."Automation" USING btree ("createdBy");


--
-- Name: Automation_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Automation_isActive_idx" ON public."Automation" USING btree ("isActive");


--
-- Name: Automation_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Automation_tenantId_idx" ON public."Automation" USING btree ("tenantId");


--
-- Name: Backup_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Backup_createdBy_idx" ON public."Backup" USING btree ("createdBy");


--
-- Name: Backup_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Backup_status_idx" ON public."Backup" USING btree (status);


--
-- Name: Backup_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Backup_tenantId_idx" ON public."Backup" USING btree ("tenantId");


--
-- Name: Backup_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Backup_type_idx" ON public."Backup" USING btree (type);


--
-- Name: Contact_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_email_idx" ON public."Contact" USING btree (email);


--
-- Name: Contact_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_instanceId_idx" ON public."Contact" USING btree ("instanceId");


--
-- Name: Contact_instanceId_phoneNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Contact_instanceId_phoneNumber_key" ON public."Contact" USING btree ("instanceId", "phoneNumber");


--
-- Name: Contact_isBlocked_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_isBlocked_idx" ON public."Contact" USING btree ("isBlocked");


--
-- Name: Contact_phoneNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_phoneNumber_idx" ON public."Contact" USING btree ("phoneNumber");


--
-- Name: Contact_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_tenantId_idx" ON public."Contact" USING btree ("tenantId");


--
-- Name: Conversation_assignedTo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_assignedTo_idx" ON public."Conversation" USING btree ("assignedTo");


--
-- Name: Conversation_contactId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_contactId_idx" ON public."Conversation" USING btree ("contactId");


--
-- Name: Conversation_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_instanceId_idx" ON public."Conversation" USING btree ("instanceId");


--
-- Name: Conversation_lastMessageAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_lastMessageAt_idx" ON public."Conversation" USING btree ("lastMessageAt");


--
-- Name: Conversation_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_priority_idx" ON public."Conversation" USING btree (priority);


--
-- Name: Conversation_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_status_idx" ON public."Conversation" USING btree (status);


--
-- Name: Conversation_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_teamId_idx" ON public."Conversation" USING btree ("teamId");


--
-- Name: Conversation_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_tenantId_idx" ON public."Conversation" USING btree ("tenantId");


--
-- Name: FlowExecutionStep_executionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecutionStep_executionId_idx" ON public."FlowExecutionStep" USING btree ("executionId");


--
-- Name: FlowExecutionStep_nodeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecutionStep_nodeId_idx" ON public."FlowExecutionStep" USING btree ("nodeId");


--
-- Name: FlowExecutionStep_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecutionStep_status_idx" ON public."FlowExecutionStep" USING btree (status);


--
-- Name: FlowExecution_flowId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecution_flowId_idx" ON public."FlowExecution" USING btree ("flowId");


--
-- Name: FlowExecution_startedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecution_startedAt_idx" ON public."FlowExecution" USING btree ("startedAt");


--
-- Name: FlowExecution_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecution_status_idx" ON public."FlowExecution" USING btree (status);


--
-- Name: FlowExecution_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecution_tenantId_idx" ON public."FlowExecution" USING btree ("tenantId");


--
-- Name: FlowExecution_triggeredBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowExecution_triggeredBy_idx" ON public."FlowExecution" USING btree ("triggeredBy");


--
-- Name: Flow_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Flow_createdBy_idx" ON public."Flow" USING btree ("createdBy");


--
-- Name: Flow_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Flow_isActive_idx" ON public."Flow" USING btree ("isActive");


--
-- Name: Flow_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Flow_tenantId_idx" ON public."Flow" USING btree ("tenantId");


--
-- Name: Flow_triggerType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Flow_triggerType_idx" ON public."Flow" USING btree ("triggerType");


--
-- Name: MessageReaction_messageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MessageReaction_messageId_idx" ON public."MessageReaction" USING btree ("messageId");


--
-- Name: MessageReaction_messageId_userId_emoji_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON public."MessageReaction" USING btree ("messageId", "userId", emoji);


--
-- Name: MessageReaction_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MessageReaction_tenantId_idx" ON public."MessageReaction" USING btree ("tenantId");


--
-- Name: MessageReaction_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MessageReaction_userId_idx" ON public."MessageReaction" USING btree ("userId");


--
-- Name: Message_contactId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_contactId_idx" ON public."Message" USING btree ("contactId");


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: Message_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_createdAt_idx" ON public."Message" USING btree ("createdAt");


--
-- Name: Message_direction_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_direction_idx" ON public."Message" USING btree (direction);


--
-- Name: Message_externalId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_externalId_idx" ON public."Message" USING btree ("externalId");


--
-- Name: Message_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_instanceId_idx" ON public."Message" USING btree ("instanceId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: Message_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_status_idx" ON public."Message" USING btree (status);


--
-- Name: Message_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_tenantId_idx" ON public."Message" USING btree ("tenantId");


--
-- Name: PasswordResetToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PasswordResetToken_expiresAt_idx" ON public."PasswordResetToken" USING btree ("expiresAt");


--
-- Name: PasswordResetToken_tokenHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PasswordResetToken_tokenHash_idx" ON public."PasswordResetToken" USING btree ("tokenHash");


--
-- Name: PasswordResetToken_tokenHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON public."PasswordResetToken" USING btree ("tokenHash");


--
-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PasswordResetToken_userId_idx" ON public."PasswordResetToken" USING btree ("userId");


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: Session_refreshToken_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_refreshToken_idx" ON public."Session" USING btree ("refreshToken");


--
-- Name: Session_refreshToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_refreshToken_key" ON public."Session" USING btree ("refreshToken");


--
-- Name: Session_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_status_idx" ON public."Session" USING btree (status);


--
-- Name: Session_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_tenantId_idx" ON public."Session" USING btree ("tenantId");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: Team_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Team_name_idx" ON public."Team" USING btree (name);


--
-- Name: Team_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Team_tenantId_idx" ON public."Team" USING btree ("tenantId");


--
-- Name: Tenant_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Tenant_ownerId_idx" ON public."Tenant" USING btree ("ownerId");


--
-- Name: Tenant_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Tenant_status_idx" ON public."Tenant" USING btree (status);


--
-- Name: TicketAttachment_commentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketAttachment_commentId_idx" ON public."TicketAttachment" USING btree ("commentId");


--
-- Name: TicketAttachment_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketAttachment_tenantId_idx" ON public."TicketAttachment" USING btree ("tenantId");


--
-- Name: TicketAttachment_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketAttachment_ticketId_idx" ON public."TicketAttachment" USING btree ("ticketId");


--
-- Name: TicketCategory_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketCategory_isActive_idx" ON public."TicketCategory" USING btree ("isActive");


--
-- Name: TicketCategory_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketCategory_order_idx" ON public."TicketCategory" USING btree ("order");


--
-- Name: TicketCategory_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketCategory_parentId_idx" ON public."TicketCategory" USING btree ("parentId");


--
-- Name: TicketCategory_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketCategory_tenantId_idx" ON public."TicketCategory" USING btree ("tenantId");


--
-- Name: TicketComment_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketComment_authorId_idx" ON public."TicketComment" USING btree ("authorId");


--
-- Name: TicketComment_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketComment_createdAt_idx" ON public."TicketComment" USING btree ("createdAt");


--
-- Name: TicketComment_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketComment_tenantId_idx" ON public."TicketComment" USING btree ("tenantId");


--
-- Name: TicketComment_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketComment_ticketId_idx" ON public."TicketComment" USING btree ("ticketId");


--
-- Name: Ticket_assignedTo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_assignedTo_idx" ON public."Ticket" USING btree ("assignedTo");


--
-- Name: Ticket_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_categoryId_idx" ON public."Ticket" USING btree ("categoryId");


--
-- Name: Ticket_contactId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_contactId_idx" ON public."Ticket" USING btree ("contactId");


--
-- Name: Ticket_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_conversationId_idx" ON public."Ticket" USING btree ("conversationId");


--
-- Name: Ticket_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_createdAt_idx" ON public."Ticket" USING btree ("createdAt");


--
-- Name: Ticket_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_createdBy_idx" ON public."Ticket" USING btree ("createdBy");


--
-- Name: Ticket_dueAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_dueAt_idx" ON public."Ticket" USING btree ("dueAt");


--
-- Name: Ticket_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_teamId_idx" ON public."Ticket" USING btree ("teamId");


--
-- Name: Ticket_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_tenantId_idx" ON public."Ticket" USING btree ("tenantId");


--
-- Name: UserTeam_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserTeam_teamId_idx" ON public."UserTeam" USING btree ("teamId");


--
-- Name: UserTeam_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserTeam_userId_idx" ON public."UserTeam" USING btree ("userId");


--
-- Name: UserTeam_userId_teamId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserTeam_userId_teamId_key" ON public."UserTeam" USING btree ("userId", "teamId");


--
-- Name: UserTeam_userTenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserTeam_userTenantId_idx" ON public."UserTeam" USING btree ("userTenantId");


--
-- Name: UserTenant_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserTenant_role_idx" ON public."UserTenant" USING btree (role);


--
-- Name: UserTenant_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserTenant_tenantId_idx" ON public."UserTenant" USING btree ("tenantId");


--
-- Name: UserTenant_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserTenant_userId_idx" ON public."UserTenant" USING btree ("userId");


--
-- Name: UserTenant_userId_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserTenant_userId_tenantId_key" ON public."UserTenant" USING btree ("userId", "tenantId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_isSuperadmin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_isSuperadmin_idx" ON public."User" USING btree ("isSuperadmin");


--
-- Name: WhatsAppInstance_phoneNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WhatsAppInstance_phoneNumber_idx" ON public."WhatsAppInstance" USING btree ("phoneNumber");


--
-- Name: WhatsAppInstance_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WhatsAppInstance_status_idx" ON public."WhatsAppInstance" USING btree (status);


--
-- Name: WhatsAppInstance_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WhatsAppInstance_tenantId_idx" ON public."WhatsAppInstance" USING btree ("tenantId");


--
-- Name: AuditLog AuditLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AutomationExecution AutomationExecution_automationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AutomationExecution"
    ADD CONSTRAINT "AutomationExecution_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES public."Automation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AutomationExecution AutomationExecution_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AutomationExecution"
    ADD CONSTRAINT "AutomationExecution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AutomationExecution AutomationExecution_triggeredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AutomationExecution"
    ADD CONSTRAINT "AutomationExecution_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Automation Automation_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Automation"
    ADD CONSTRAINT "Automation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Automation Automation_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Automation"
    ADD CONSTRAINT "Automation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Backup Backup_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Backup"
    ADD CONSTRAINT "Backup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Backup Backup_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Backup"
    ADD CONSTRAINT "Backup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contact Contact_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."WhatsAppInstance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contact Contact_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_closedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."WhatsAppInstance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowExecutionStep FlowExecutionStep_executionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowExecutionStep"
    ADD CONSTRAINT "FlowExecutionStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES public."FlowExecution"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowExecution FlowExecution_flowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowExecution"
    ADD CONSTRAINT "FlowExecution_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES public."Flow"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowExecution FlowExecution_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowExecution"
    ADD CONSTRAINT "FlowExecution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowExecution FlowExecution_triggeredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowExecution"
    ADD CONSTRAINT "FlowExecution_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Flow Flow_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Flow"
    ADD CONSTRAINT "Flow_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Flow Flow_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Flow"
    ADD CONSTRAINT "Flow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageReaction MessageReaction_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageReaction MessageReaction_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageReaction MessageReaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."WhatsAppInstance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_repliedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_repliedToId_fkey" FOREIGN KEY ("repliedToId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Team Team_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tenant Tenant_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TicketAttachment TicketAttachment_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketAttachment"
    ADD CONSTRAINT "TicketAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."TicketComment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketAttachment TicketAttachment_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketAttachment"
    ADD CONSTRAINT "TicketAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketAttachment TicketAttachment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketAttachment"
    ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketCategory TicketCategory_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketCategory"
    ADD CONSTRAINT "TicketCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."TicketCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketCategory TicketCategory_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketCategory"
    ADD CONSTRAINT "TicketCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketComment TicketComment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TicketComment TicketComment_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketComment TicketComment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."TicketCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_closedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_resolvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTeam UserTeam_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserTeam"
    ADD CONSTRAINT "UserTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTeam UserTeam_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserTeam"
    ADD CONSTRAINT "UserTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTeam UserTeam_userTenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserTeam"
    ADD CONSTRAINT "UserTeam_userTenantId_fkey" FOREIGN KEY ("userTenantId") REFERENCES public."UserTenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserTenant UserTenant_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserTenant"
    ADD CONSTRAINT "UserTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTenant UserTenant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserTenant"
    ADD CONSTRAINT "UserTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WhatsAppInstance WhatsAppInstance_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WhatsAppInstance"
    ADD CONSTRAINT "WhatsAppInstance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict qQYXbuJIgebf8OZ9ejx7xxZRBzFdMZf5EZfqwzyDdgKFmatJEgNLLg14zoCDwoN

