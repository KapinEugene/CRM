-- Table: public.crm

-- DROP TABLE IF EXISTS public.crm;

-- DROP TABLE IF EXISTS public.crm_contact;

CREATE TABLE IF NOT EXISTS public.crm
(
    id SERIAL PRIMARY KEY,
    name character varying(100) COLLATE pg_catalog."default" NULL,
    lastName character varying(100) COLLATE pg_catalog."default" NULL,
    surname character varying(100) COLLATE pg_catalog."default" NULL
)

CREATE TABLE IF NOT EXISTS public.crm_contact
(
    id SERIAL PRIMARY KEY,
    type character varying(100) COLLATE pg_catalog."default" NULL,
    value character varying(100) COLLATE pg_catalog."default" NULL,
    user_id integer,
    FOREIGN KEY (user_id) REFERENCES public.crm (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.crm
    OWNER to postgres;
