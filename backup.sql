--
-- PostgreSQL database dump
--

\restrict O2Np9ZhX0HtSBCcDI48NB2zIY5cKiK9oQK5Nf8cKw2QKqSAPkJfX1c0gf62KKJg

-- Dumped from database version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sex_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sex_type AS ENUM (
    'M',
    'F'
);


ALTER TYPE public.sex_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    event_id integer NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    slug character varying(150),
    description text NOT NULL,
    overview character varying(500) NOT NULL,
    image text NOT NULL,
    venue character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    mode character varying(10),
    audience character varying(255) NOT NULL,
    agenda text[],
    organizer character varying(255) NOT NULL,
    tags text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT events_mode_check CHECK (((mode)::text = ANY ((ARRAY['online'::character varying, 'offline'::character varying, 'hybrid'::character varying])::text[])))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    user_email text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, event_id, email, created_at, updated_at) FROM stdin;
18	8	ziyavulhaq94@gmail.com	2026-04-30 19:18:20.009755	2026-04-30 19:18:20.009755
19	8	ziyavulhaq95@gmail.com	2026-04-30 21:28:31.403052	2026-04-30 21:28:31.403052
20	7	ziyavulhaq94@gmail.com	2026-05-01 14:31:41.264772	2026-05-01 14:31:41.264772
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, slug, description, overview, image, venue, location, date, "time", mode, audience, agenda, organizer, tags, created_at, updated_at) FROM stdin;
7	DevMeet 2027 30	devmeet-2027-30	A developer meetup for Next.js and MERN developers	A one-day community event covering Next.js 16, MERN patterns, and practical AI workflows.	https://res.cloudinary.com/dcagxcuyp/image/upload/v1777462408/DevEvent/hz1x9bgi1hor7qssfxqi.png	tartup Hub Kochi	Kochi, Kerala	2026-07-10	00:00:00	offline	Frontend developers, MERN developers, and students	{"10:00 - Next.js 16 Deep Dive - Alex","11:30 - Building AI Apps - Sarah"}	DevMeet Community nn	{tech,meetup}	2026-04-29 17:03:31.504216	2026-04-29 17:03:31.504216
8	DevMeet 2027 25	devmeet-2027-25	A developer meetup for Next.js and MERN developers	A one-day community event covering Next.js 16, MERN patterns, and practical AI workflows.	https://res.cloudinary.com/dcagxcuyp/image/upload/v1777462503/DevEvent/ngwn4tmb4yfku5gcezop.png	tartup Hub Kochi	Kochi, Kerala	2026-07-10	00:00:00	offline	Frontend developers, MERN developers, and students	{"10:00 - Next.js 16 Deep Dive - Alex","11:30 - Building AI Apps - Sarah"}	DevMeet Community nn	{tech,meetup}	2026-04-29 17:05:04.248615	2026-04-29 17:05:04.248615
4	DevMeet 2027 18	devmeet-2027-18	A developer meetup for Next.js and MERN developers	A one-day community event covering Next.js 16, MERN patterns, and practical AI workflows.	https://res.cloudinary.com/dcagxcuyp/image/upload/v1777467350/DevEvent/devmeet-2027-18-4.png	tartup Hub Kochi	Kochi, Kerala	2026-07-09	00:00:00	offline	Frontend developers, MERN developers, and students	{"10:00 - Next.js 16 Deep Dive - Alex","11:30 - Building AI Apps - Sarah"}	DevMeet Community nn	{tech,meetup}	2026-04-29 15:28:07.173195	2026-04-29 15:28:07.173195
6	DevMeet 2027 10	devmeet-2027-10	A developer meetup for Next.js and MERN developers	A one-day community event covering Next.js 16, MERN patterns, and practical AI workflows.	https://res.cloudinary.com/dcagxcuyp/image/upload/v1777467351/DevEvent/devmeet-2027-10-6.png	tartup Hub Kochi	Kochi, Kerala	2026-07-10	00:00:00	offline	Frontend developers, MERN developers, and students	{"10:00 - Next.js 16 Deep Dive - Alex","11:30 - Building AI Apps - Sarah"}	DevMeet Community nn	{tech,meetup}	2026-04-29 15:29:13.531952	2026-04-29 15:29:13.531952
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, user_email, message, created_at) FROM stdin;
2	guest@example.com	fmkejnfichre	2026-05-01 12:39:38.219218
3	guest@example.com	emfejrfhb	2026-05-01 12:40:18.768635
4	guest@example.com	fmkecrjnjfber	2026-05-01 12:40:22.027228
5	guest@example.com	f,erkfvijer	2026-05-01 12:40:24.32854
6	guest@example.com	lllll	2026-05-01 12:40:27.611786
7	guest@example.com	lll	2026-05-01 12:40:29.919028
8	guest@example.com	aaaa	2026-05-01 12:40:34.453251
9	guest@example.com	fmkrejfh	2026-05-01 12:40:54.381459
10	guest@example.com	evmkenivje	2026-05-01 12:40:55.033039
11	ziyavulhaq94@gmail.com	fmkwejf	2026-05-01 14:18:07.045969
12	ziyavulhaq94@gmail.com	femlkfe	2026-05-01 14:28:33.946993
13	ziyavulhaq94@gmail.com	podaa	2026-05-01 14:28:48.390507
14	ziyavulhaq95@gmail.com	cmjewjnuedew	2026-05-01 14:29:20.216583
15	ziyavulhaq94@gmail.com	entthaa jomu	2026-05-01 14:29:35.13747
16	ziyavulhaq94@gmail.com	fmejnf	2026-05-01 14:31:45.656933
17	ziyavulhaq95@gmail.com	mhytfghj	2026-05-01 14:32:05.908945
18	ziyavulhaq94@gmail.com	mdjnfurf	2026-05-06 11:01:25.333662
\.


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bookings_id_seq', 20, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 8, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 18, true);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: events events_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_slug_key UNIQUE (slug);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: bookings uniq_event_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT uniq_event_email UNIQUE (event_id, email);


--
-- Name: bookings fk_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict O2Np9ZhX0HtSBCcDI48NB2zIY5cKiK9oQK5Nf8cKw2QKqSAPkJfX1c0gf62KKJg

