--
-- PostgreSQL database dump
--

\restrict kA4pnRtT1JYCAXDYLi0PaXpXH46i8g63swAXGdP7NbbNxJpl5fZsgrxtkhaK7PC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-09 07:03:51

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
-- TOC entry 2 (class 3079 OID 16633)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5031 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 284 (class 1255 OID 17153)
-- Name: add_employee(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_employee(e_name character varying, e_email character varying, e_role character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
temp_password text;
begin
temp_password=substr(md5(random()::text),1,8);
insert into employees(name,email,password_hash,role)
values(e_name,e_email,crypt(temp_password,gen_salt('bf')),e_role);
return temp_password;
end;
$$;


ALTER FUNCTION public.add_employee(e_name character varying, e_email character varying, e_role character varying) OWNER TO postgres;

--
-- TOC entry 267 (class 1255 OID 17173)
-- Name: apply_leave(integer, character varying, text, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_leave(e_employee_id integer, e_leave_type character varying, e_reason text, e_start_date date, e_end_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
insert into leave_management(employee_id,leave_type,reason,start_date,end_date)
values(e_employee_id,e_leave_type,e_reason,e_start_date,e_end_date);
end;
$$;


ALTER FUNCTION public.apply_leave(e_employee_id integer, e_leave_type character varying, e_reason text, e_start_date date, e_end_date date) OWNER TO postgres;

--
-- TOC entry 287 (class 1255 OID 17234)
-- Name: approve_leave(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.approve_leave(e_leave_id integer, e_approver_id integer, e_status character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
v_employee_id integer;
v_manager_id integer;
v_hr_id integer;
v_approved_count int;
begin
select lm.employee_id,e.manager_id,e.hr_id
into v_employee_id,v_manager_id,v_hr_id
from leave_management lm
join employees e on lm.employee_id = e.id
where lm.id=e_leave_id;
if not found then 
return 'leave request not found';
end if;
if e_approver_id not in (v_manager_id,v_hr_id) then
return 'unauthorized';
end if;
insert into leave_approvals(leave_id,approver_id,status,updated_at)
values(e_leave_id,e_approver_id,e_status,NOW())
on conflict(leave_id,approver_id)
do update set status = excluded.status,updated_at=NOW();
if exists(select 1 from leave_approvals where leave_id = e_leave_id and status='Rejected')then
update leave_management
set status = 'Rejected'
where id=e_leave_id;
return 'leave rejected';
end if;
select count(distinct approver_id)
into v_approved_count
from leave_approvals
where leave_id=e_leave_id and status ='Approved';
if v_approved_count=2 then 
update leave_management
set status ='Approved'
where id=e_leave_id;
return 'leave approved by both manager and hr';
end if;
if v_approved_count =1 then
update leave_management
set status = 'Partially Approved'
where id=e_leave_id;
return 'leave partially approved';
end if;
return 'approval recorded';
end;
$$;


ALTER FUNCTION public.approve_leave(e_leave_id integer, e_approver_id integer, e_status character varying) OWNER TO postgres;

--
-- TOC entry 285 (class 1255 OID 17231)
-- Name: approve_leave(integer, integer, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.approve_leave(p_leave_id integer, p_approver_id integer, p_approver_role character varying, p_status character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
 INSERT INTO leave_approvals (leave_id, approver_id, approver_role, status, updated_at)
    VALUES (p_leave_id, p_approver_id, p_approver_role, p_status, NOW())
    ON CONFLICT (leave_id, approver_role)
    DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
IF (
        SELECT COUNT(*) FROM leave_approvals
        WHERE leave_id = p_leave_id AND status = 'Approved'
    ) = 2 THEN
        UPDATE leave_management
        SET status = 'Approved'
        WHERE id = p_leave_id;
END IF;
IF EXISTS (
        SELECT 1 FROM leave_approvals
        WHERE leave_id = p_leave_id AND status = 'Rejected'
    ) THEN
        UPDATE leave_management
        SET status = 'Rejected'
        WHERE id = p_leave_id;
    END IF;

    RETURN 'Approval recorded';
END;
$$;


ALTER FUNCTION public.approve_leave(p_leave_id integer, p_approver_id integer, p_approver_role character varying, p_status character varying) OWNER TO postgres;

--
-- TOC entry 270 (class 1255 OID 17128)
-- Name: forgot_password(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.forgot_password(e_email character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
temp_password text;
begin
temp_password=substr(md5(random()::text),1,8);
update employees
set password_hash=crypt(temp_password,gen_salt('bf'))
where email=e_email;
return temp_password;
end;
$$;


ALTER FUNCTION public.forgot_password(e_email character varying) OWNER TO postgres;

--
-- TOC entry 271 (class 1255 OID 17195)
-- Name: init_leave_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.init_leave_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO leave_balance (employee_id, sick_leaves, casual_leaves, paid_leaves)
    VALUES (NEW.id, 6, 6, 15);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.init_leave_balance() OWNER TO postgres;

--
-- TOC entry 269 (class 1255 OID 17255)
-- Name: save_attendance(integer, date, character varying, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_attendance(e_emp_id integer, e_date date, e_action character varying, e_hours integer, e_project character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
begin
INSERT INTO attendance (employee_id, date, action, hours, project, updated_at)
values(e_emp_id,e_date,e_action,e_hours,e_project,NOW())
on conflict(employee_id,date)
do update set
action = EXCLUDED.action,hours = EXCLUDED.hours,project = EXCLUDED.project,updated_at = NOW();
return 'attendence saved successfully';
end;
$$;


ALTER FUNCTION public.save_attendance(e_emp_id integer, e_date date, e_action character varying, e_hours integer, e_project character varying) OWNER TO postgres;

--
-- TOC entry 288 (class 1255 OID 17293)
-- Name: save_employee_master(integer, integer, integer, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_employee_master(e_emp_id integer, e_m1_id integer, e_hr1_id integer, e_m2_id integer DEFAULT NULL::integer, e_m3_id integer DEFAULT NULL::integer, e_hr2_id integer DEFAULT NULL::integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
begin
insert into employee_master(emp_id,manager1_id,hr1_id,manager2_id,manager3_id,hr2_id)
values (e_emp_id,e_m1_id,e_hr1_id,e_m2_id,e_m3_id,e_hr2_id)
on conflict (emp_id) do update set manager1_id=excluded.manager1_id,manager2_id=excluded.manager2_id,manager3_id=excluded.manager3_id,hr1_id=excluded.hr1_id,hr2_id=excluded.hr2_id;
return 'employee master saved successfully';
end;
$$;


ALTER FUNCTION public.save_employee_master(e_emp_id integer, e_m1_id integer, e_hr1_id integer, e_m2_id integer, e_m3_id integer, e_hr2_id integer) OWNER TO postgres;

--
-- TOC entry 268 (class 1255 OID 17122)
-- Name: set_emp_password(character varying, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_emp_password(e_email character varying, e_old_pass text, e_new_pass text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
declare
stored_hash text;
begin
select password_hash into stored_hash
from employees
where email=e_email;
if stored_hash is null or crypt(e_old_pass ,stored_hash)<>stored_hash then
return false;
end if;
update employees
set password_hash=crypt(e_new_pass,gen_salt('bf'))
where email=e_email;
return true;
end;
$$;


ALTER FUNCTION public.set_emp_password(e_email character varying, e_old_pass text, e_new_pass text) OWNER TO postgres;

--
-- TOC entry 286 (class 1255 OID 17193)
-- Name: update_leave_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_leave_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
IF NEW.status = 'Approved' THEN
IF NEW.leave_type = 'Sick' THEN
UPDATE leave_balance
SET sick_leaves = sick_leaves - NEW.no_of_days,updated_at=NOW()
where employee_id=NEW.employee_id;
elseif NEW.leave_type='Casual' then
update leave_balance
set casual_leaves=casual_leaves-NEW.no_of_days,updated_at=NOW()
where employee_id=NEW.employee_id;
elseif NEW.leave_type='paid' then
update leave_balance
set paid_leaves=paid_leaves-NEW.no_of_days,updated_at=NOW()
where employee_id=NEW.employee_id;
end if;
end if;
return NEW;
end;
$$;


ALTER FUNCTION public.update_leave_balance() OWNER TO postgres;

--
-- TOC entry 272 (class 1255 OID 17146)
-- Name: upload_document(integer, character varying, character varying, bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upload_document(e_id integer, e_file_name character varying, e_file_type character varying, e_file_data bytea) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
insert into documents(employee_id,file_name,file_type,file_data)
values(e_id,e_file_name,e_file_type,e_file_data);
end;
$$;


ALTER FUNCTION public.upload_document(e_id integer, e_file_name character varying, e_file_type character varying, e_file_data bytea) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 17239)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer,
    date date NOT NULL,
    action character varying(20),
    hours integer,
    project character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT attendance_action_check CHECK (((action)::text = ANY ((ARRAY['Present'::character varying, 'WFH'::character varying, 'Leave'::character varying])::text[])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17238)
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 228
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- TOC entry 221 (class 1259 OID 17130)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(100),
    file_data bytea
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17129)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 5036 (class 0 OID 0)
-- Dependencies: 220
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 230 (class 1259 OID 17259)
-- Name: employee_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_master (
    emp_id integer NOT NULL,
    manager1_id integer NOT NULL,
    manager2_id integer,
    manager3_id integer,
    hr1_id integer NOT NULL,
    hr2_id integer
);


ALTER TABLE public.employee_master OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16621)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(100),
    email character varying(100),
    password_hash text,
    role character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    manager_id integer,
    hr_id integer
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16620)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 218
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 227 (class 1259 OID 17212)
-- Name: leave_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_approvals (
    id integer NOT NULL,
    leave_id integer,
    approver_id integer,
    approver_role character varying(50),
    status character varying(20) DEFAULT 'Pending'::character varying,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leave_approvals_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.leave_approvals OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17211)
-- Name: leave_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_approvals_id_seq OWNER TO postgres;

--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 226
-- Name: leave_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_approvals_id_seq OWNED BY public.leave_approvals.id;


--
-- TOC entry 225 (class 1259 OID 17177)
-- Name: leave_balance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    sick_leaves integer DEFAULT 0,
    casual_leaves integer DEFAULT 0,
    paid_leaves integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leave_balance OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17176)
-- Name: leave_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_balance_id_seq OWNER TO postgres;

--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 224
-- Name: leave_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_balance_id_seq OWNED BY public.leave_balance.id;


--
-- TOC entry 223 (class 1259 OID 17155)
-- Name: leave_management; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_management (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    reason text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    no_of_days integer GENERATED ALWAYS AS (((end_date - start_date) + 1)) STORED,
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    manager_status character varying(20) DEFAULT 'Pending'::character varying,
    hr_status character varying(20) DEFAULT 'Pending'::character varying,
    leave_type character varying(20),
    CONSTRAINT leave_management_hr_status_check CHECK (((hr_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[]))),
    CONSTRAINT leave_management_manager_status_check CHECK (((manager_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.leave_management OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17154)
-- Name: leave_management_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_management_id_seq OWNER TO postgres;

--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 222
-- Name: leave_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_management_id_seq OWNED BY public.leave_management.id;


--
-- TOC entry 4840 (class 2604 OID 17242)
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 17133)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4821 (class 2604 OID 16624)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 17215)
-- Name: leave_approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals ALTER COLUMN id SET DEFAULT nextval('public.leave_approvals_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 17180)
-- Name: leave_balance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance ALTER COLUMN id SET DEFAULT nextval('public.leave_balance_id_seq'::regclass);


--
-- TOC entry 4824 (class 2604 OID 17158)
-- Name: leave_management id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_management ALTER COLUMN id SET DEFAULT nextval('public.leave_management_id_seq'::regclass);


--
-- TOC entry 4860 (class 2606 OID 17249)
-- Name: attendance attendance_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_date_key UNIQUE (employee_id, date);


--
-- TOC entry 4862 (class 2606 OID 17247)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 17138)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 17295)
-- Name: employee_master employee_master_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_pk PRIMARY KEY (emp_id);


--
-- TOC entry 4848 (class 2606 OID 16629)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 17220)
-- Name: leave_approvals leave_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals
    ADD CONSTRAINT leave_approvals_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 17187)
-- Name: leave_balance leave_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance
    ADD CONSTRAINT leave_balance_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 17167)
-- Name: leave_management leave_management_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_management
    ADD CONSTRAINT leave_management_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 17236)
-- Name: leave_approvals unique_leave_approver; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals
    ADD CONSTRAINT unique_leave_approver UNIQUE (leave_id, approver_id);


--
-- TOC entry 4879 (class 2620 OID 17196)
-- Name: employees trg_init_leave_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_init_leave_balance AFTER INSERT ON public.employees FOR EACH ROW EXECUTE FUNCTION public.init_leave_balance();


--
-- TOC entry 4880 (class 2620 OID 17237)
-- Name: leave_management trg_update_leave_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_leave_balance AFTER INSERT OR UPDATE ON public.leave_management FOR EACH ROW EXECUTE FUNCTION public.update_leave_balance();


--
-- TOC entry 4872 (class 2606 OID 17250)
-- Name: attendance attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 4867 (class 2606 OID 17139)
-- Name: documents documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 4873 (class 2606 OID 17262)
-- Name: employee_master employee_master_emp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_emp_id_fkey FOREIGN KEY (emp_id) REFERENCES public.employees(id);


--
-- TOC entry 4874 (class 2606 OID 17282)
-- Name: employee_master employee_master_hr1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_hr1_id_fkey FOREIGN KEY (hr1_id) REFERENCES public.employees(id);


--
-- TOC entry 4875 (class 2606 OID 17287)
-- Name: employee_master employee_master_hr2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_hr2_id_fkey FOREIGN KEY (hr2_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- TOC entry 4876 (class 2606 OID 17267)
-- Name: employee_master employee_master_manager1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_manager1_id_fkey FOREIGN KEY (manager1_id) REFERENCES public.employees(id);


--
-- TOC entry 4877 (class 2606 OID 17272)
-- Name: employee_master employee_master_manager2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_manager2_id_fkey FOREIGN KEY (manager2_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- TOC entry 4878 (class 2606 OID 17277)
-- Name: employee_master employee_master_manager3_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_manager3_id_fkey FOREIGN KEY (manager3_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- TOC entry 4865 (class 2606 OID 17202)
-- Name: employees employees_hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_hr_id_fkey FOREIGN KEY (hr_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- TOC entry 4866 (class 2606 OID 17197)
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- TOC entry 4870 (class 2606 OID 17226)
-- Name: leave_approvals leave_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals
    ADD CONSTRAINT leave_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 4871 (class 2606 OID 17221)
-- Name: leave_approvals leave_approvals_leave_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals
    ADD CONSTRAINT leave_approvals_leave_id_fkey FOREIGN KEY (leave_id) REFERENCES public.leave_management(id) ON DELETE CASCADE;


--
-- TOC entry 4869 (class 2606 OID 17188)
-- Name: leave_balance leave_balance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance
    ADD CONSTRAINT leave_balance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 4868 (class 2606 OID 17168)
-- Name: leave_management leave_management_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_management
    ADD CONSTRAINT leave_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE attendance; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.attendance TO admin;


--
-- TOC entry 5034 (class 0 OID 0)
-- Dependencies: 228
-- Name: SEQUENCE attendance_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.attendance_id_seq TO admin;


--
-- TOC entry 5035 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.documents TO admin;


--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 220
-- Name: SEQUENCE documents_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.documents_id_seq TO admin;


--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE employee_master; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.employee_master TO admin;


--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE employees; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.employees TO admin;


--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 218
-- Name: SEQUENCE employees_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.employees_id_seq TO admin;


--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE leave_approvals; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.leave_approvals TO admin;


--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 226
-- Name: SEQUENCE leave_approvals_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.leave_approvals_id_seq TO admin;


--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE leave_balance; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.leave_balance TO admin;


--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 224
-- Name: SEQUENCE leave_balance_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.leave_balance_id_seq TO admin;


--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE leave_management; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.leave_management TO admin;


--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 222
-- Name: SEQUENCE leave_management_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.leave_management_id_seq TO admin;


--
-- TOC entry 2122 (class 826 OID 17175)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;


--
-- TOC entry 2121 (class 826 OID 17174)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO admin;


-- Completed on 2025-09-09 07:03:51

--
-- PostgreSQL database dump complete
--

\unrestrict kA4pnRtT1JYCAXDYLi0PaXpXH46i8g63swAXGdP7NbbNxJpl5fZsgrxtkhaK7PC

CREATE OR REPLACE FUNCTION create_employee_documents_row()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO documents (employee_id, aadhar, pan, latest_graduation_certificate)
VALUES (NEW.id, ''::bytea, ''::bytea, ''::bytea); 
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_emp_insert
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION create_employee_documents_row();


CREATE OR REPLACE FUNCTION public.upload_document(e_emp_id integer, e_doc_type text, e_doc bytea)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
begin
INSERT INTO documents (employee_id, aadhar, pan,latest_graduation_certificate)
values(e_emp_id,NULL,NULL,NULL)
on conflict (employee_id) do nothing;
CASE e_doc_type
WHEN 'aadhar' THEN update documents set aadhar=e_doc where employee_id=e_emp_id;
 WHEN 'pan' THEN update documents set pan=e_doc where employee_id=e_emp_id;
WHEN 'latest_graduation_certificate' THEN update documents set latest_graduation_certificate=e_doc where emp
loyee_id=emp_id;
WHEN 'latest_graduation_certificate' THEN update documents set latest_graduation_certificate=e_doc where emp
loyee_id=e_emp_id;
WHEN 'updated_resume' THEN update documents set updated_resume=e_doc where employee_id=e_emp_id;
WHEN 'offer_letter' THEN update documents set offer_letter=e_doc where employee_id=e_emp_id;
 WHEN 'latest_compensation_letter' THEN update documents set latest_compensation_letter=e_doc where employee
_id=e_emp_id;
WHEN 'experience_relieving_letter' THEN update documents set experience_relieving_letter=e_doc where employe
e_id=e_emp_id;
WHEN 'latest_3_months_payslips' THEN update documents set latest_3_months_payslips=e_doc where employee_id=e
_emp_id;
WHEN 'form16_or_12b_taxable_income' THEN update documents set form16_or_12b_or_taxable_income=e_doc where em
ployee_id=e_emp_id;
 WHEN 'ssc_certificate' THEN update documents set ssc_certificate=e_doc where employee_id=e_emp_id;
WHEN 'hsc_certificate' THEN update documents set hsc_certificate=e_doc where employee_id=e_emp_id;
 WHEN 'hsc_marksheet' THEN update documents set hsc_marksheet=e_doc where employee_id=e_emp_id;
WHEN 'graduation_marksheet' THEN update documents set graduation_marksheet=e_doc where employee_id=e_emp_id;
WHEN 'postgraduation_marksheet' THEN update documents set postgraduation_marksheet=e_doc where employee_id=e
_emp_id;
WHEN 'postgraduation_certificate' THEN update documents set postgraduation_certificate=e_doc where employee_
id=e_emp_id;
 WHEN 'passport' THEN update documents set passport=e_doc where employee_id=e_emp_id;
else raise exception 'incalid doc type: %',e_doc_type;
 end case;
 RETURN format('Document %s uploaded successfully for employee %s',e_doc_type,e_emp_id);
end;
$function$


CREATE TABLE employee_details (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    full_name VARCHAR(150) NOT NULL,
    contact_no VARCHAR(15) NOT NULL,
    personal_email VARCHAR(100),
    company_email VARCHAR(100) UNIQUE,
    doj DATE NOT NULL,
    dob DATE NOT NULL,
    address TEXT,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),

    graduation_year INT CHECK (graduation_year >= 1900 AND graduation_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    work_experience_years INT DEFAULT 0 CHECK (work_experience_years >= 0),

    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(15),
    emergency_contact_relation VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


create or replace function emp_details(e_emp_id int,e_full_name varchar,e_contact_no varchar,
 e_personal_mail varchar,e_doj date,e_dob date,e_address text,e_gender varchar,
 e_grad_year int,e_w_exp int,e_eme_c_name varchar,e_eme_c_no varchar,e_eme_c_rel varchar )
 returns void
 language plpgsql
 as $$
begin
insert into 
employee_details(employee_id,full_name,contact_no,personal_email,
doj,dob,address,gender,graduation_year,work_experience_years,emergency_contact_name,emergency_contact_number,
emergency_contact_relation)
values(e_emp_id,e_full_name,e_contact_no,e_personal_mail,e_doj,e_dob,e_address,e_gender,
e_grad_year,e_w_exp,e_eme_c_name,e_eme_c_no,e_eme_c_rel);
end;
$$;



CREATE OR REPLACE PROCEDURE emp_details(
    e_emp_id integer,
    e_full_name character varying,
    e_contact_no character varying,
    e_personal_mail character varying,
   
    e_dob date,
    e_address text,
    e_gender character varying,
    e_grad_year integer,
    e_w_exp integer,
    e_eme_c_name character varying,
    e_eme_c_no character varying,
    e_eme_c_rel character varying
)
LANGUAGE plpgsql
AS $procedure$
BEGIN
    INSERT INTO onboarding_emp_details (
        employee_id,
        full_name,
        contact_no,
        personal_email,
        
        dob,
        address,
        gender,
        graduation_year,
        work_experience_years,
        emergency_contact_name,
        emergency_contact_number,
        emergency_contact_relation
    )
    VALUES (
        e_emp_id,
        e_full_name,
        e_contact_no,
        e_personal_mail,
       
        e_dob,
        e_address,
        e_gender,
        e_grad_year,
        e_w_exp,
        e_eme_c_name,
        e_eme_c_no,
        e_eme_c_rel
    )
    ON CONFLICT (employee_id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        contact_no = EXCLUDED.contact_no,
        personal_email = EXCLUDED.personal_email,
       
        dob = EXCLUDED.dob,
        address = EXCLUDED.address,
        gender = EXCLUDED.gender,
        graduation_year = EXCLUDED.graduation_year,
        work_experience_years = EXCLUDED.work_experience_years,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_number = EXCLUDED.emergency_contact_number,
        emergency_contact_relation = EXCLUDED.emergency_contact_relation;
END;
$procedure$;

CREATE OR REPLACE PROCEDURE approve_employee(p_onboarding_id INT, OUT new_emp_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
   
    INSERT INTO employees (name, email, role,employment_type ,o_status, created_at)
    SELECT name, email, role,type, TRUE, now()
    FROM onboarding_employees
    WHERE id = p_onboarding_id
    RETURNING id INTO new_emp_id;

   
    INSERT INTO employee_details (
        employee_id, full_name, contact_no, personal_email, 
        dob, address, gender, graduation_year,
        work_experience_years, emergency_contact_name, 
        emergency_contact_number, emergency_contact_relation,
        created_at
    )
    SELECT new_emp_id, full_name, contact_no, personal_email, 
           dob, address, gender, graduation_year,
           work_experience_years, emergency_contact_name,
           emergency_contact_number, emergency_contact_relation,
           now()
    FROM onboarding_emp_details
    WHERE employee_id = p_onboarding_id;

   
     INSERT INTO documents (
        employee_id, aadhar, pan, latest_graduation_certificate, updated_resume,
        offer_letter, latest_compensation_letter, experience_relieving_letter,
        latest_3_months_payslips, form16_or_12b_or_taxable_income, ssc_certificate,
        hsc_certificate, hsc_marksheet, graduation_marksheet, postgraduation_marksheet,
        postgraduation_certificate, passport, uploaded_at
    )
    SELECT new_emp_id, aadhar, pan, latest_graduation_certificate, updated_resume,
           offer_letter, latest_compensation_letter, experience_relieving_letter,
           latest_3_months_payslips, form16_or_12b_or_taxable_income, ssc_certificate,
           hsc_certificate, hsc_marksheet, graduation_marksheet, postgraduation_marksheet,
           postgraduation_certificate, passport, now()
    FROM onboarding_emp_docs
    WHERE employee_id = p_onboarding_id;

  
    DELETE FROM onboarding_employees WHERE id = p_onboarding_id;
    DELETE FROM onboarding_emp_details WHERE employee_id = p_onboarding_id;
    DELETE FROM onboarding_emp_docs WHERE employee_id = p_onboarding_id;
END;
$$;


CREATE OR REPLACE PROCEDURE assign_employee(
    IN p_employee_id INT,
    IN p_location_id INT,
    IN p_doj DATE,
    IN p_company_email TEXT,
    IN p_managers INT[],
    IN p_hrs INT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = p_employee_id) THEN
        RAISE EXCEPTION 'Employee with id % not found', p_employee_id;
    END IF;

   
    UPDATE employees
    SET doj = p_doj,
        location_id = p_location_id,
        company_email = p_company_email
    WHERE id = p_employee_id;


    DELETE FROM employee_managers WHERE employee_id = p_employee_id;
    INSERT INTO employee_managers (employee_id, manager_id)
    SELECT p_employee_id, unnest(p_managers)
    LIMIT 3;

   
    DELETE FROM employee_hrs WHERE employee_id = p_employee_id;
    INSERT INTO employee_hrs (employee_id, hr_id)
    SELECT p_employee_id, unnest(p_hrs)
    LIMIT 2;

END;
$$;



CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);
CREATE TABLE master_calendar (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(location_id, holiday_date) 
);


ALTER TABLE employees ADD COLUMN location_id INT REFERENCES locations(id);


CREATE OR REPLACE FUNCTION public.set_emp_password(e_email character varying, e_old_pass text, e_new_pass text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
declare
stored_hash text;
begin
select password_hash into stored_hash
from employees
where company_email=e_email;
if stored_hash is null or crypt(e_old_pass ,stored_hash)<>stored_hash then
return false;
end if;
update employees
set password_hash=crypt(e_new_pass,gen_salt('bf'))
where company_email=e_email;
return true;
end;
$function$