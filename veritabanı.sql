PGDMP  '    (                }            dbYazGelLab    17.4    17.4 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    dbYazGelLab    DATABASE     s   CREATE DATABASE "dbYazGelLab" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'tr-TR';
    DROP DATABASE "dbYazGelLab";
                     postgres    false                       1255    16793 (   notify_admin_when_all_evaluations_done()    FUNCTION     �  CREATE FUNCTION public.notify_admin_when_all_evaluations_done() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    toplam_juri INT;
    tamamlanan_rapor INT;
    admin_id INT;
BEGIN
    -- 1. Başvuruya atanan toplam jüri üyesi sayısını bul (jury_members tablosundan alınanlar)
    SELECT COUNT(*) INTO toplam_juri
    FROM jury_members jm
    JOIN evaluations e ON jm.jury_id = e.jury_id
    WHERE e.basvuru_id = NEW.basvuru_id;

    -- 2. Başvuruya yapılmış toplam değerlendirme sayısını bul
    SELECT COUNT(*) INTO tamamlanan_rapor
    FROM evaluations
    WHERE basvuru_id = NEW.basvuru_id;

    -- 3. Eğer tüm jüri üyeleri rapor yüklediyse
    IF toplam_juri = tamamlanan_rapor THEN
        -- Yönetici (admin) user_id'sini bulalım
        SELECT user_id INTO admin_id
        FROM users
        WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'Yönetici') -- Yönetici rolü olan kullanıcıyı al
        LIMIT 1; -- İlk admini alsın (çok admin varsa daha sofistike yapılabilir)

        -- 4. Bildirim kuyruğuna ekle
        INSERT INTO notifications (user_id, basvuru_id, mesaj)
        VALUES (admin_id, NEW.basvuru_id, 'Tüm jüri üyeleri değerlendirmesini tamamladı.');
    END IF;

    RETURN NEW;
END;
$$;
 ?   DROP FUNCTION public.notify_admin_when_all_evaluations_done();
       public               postgres    false            �            1259    16447    announcements    TABLE     R  CREATE TABLE public.announcements (
    ilan_id integer NOT NULL,
    "ilan_baslık" character varying(70) NOT NULL,
    ilan_aciklama text,
    faculty_id integer,
    departman_id integer,
    kadro_id integer NOT NULL,
    baslangic_tarih timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    bitis_tarih timestamp with time zone
);
 !   DROP TABLE public.announcements;
       public         heap r       postgres    false            �            1259    16446    announcements_ilan_id_seq    SEQUENCE     �   CREATE SEQUENCE public.announcements_ilan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.announcements_ilan_id_seq;
       public               postgres    false    228            �           0    0    announcements_ilan_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.announcements_ilan_id_seq OWNED BY public.announcements.ilan_id;
          public               postgres    false    227            �            1259    16811    application_documents    TABLE     P  CREATE TABLE public.application_documents (
    application_id integer NOT NULL,
    document_id integer NOT NULL,
    dosya_url character varying(2048),
    upload_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_verified boolean DEFAULT false,
    is_baslica_yazar boolean DEFAULT false,
    verification_notes text
);
 )   DROP TABLE public.application_documents;
       public         heap r       postgres    false            �            1259    16513    applications    TABLE     �   CREATE TABLE public.applications (
    application_id integer NOT NULL,
    user_id integer,
    basvuru_id integer,
    basvuru_tarihi timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    durum character varying(30)
);
     DROP TABLE public.applications;
       public         heap r       postgres    false            �            1259    16512    applications_application_id_seq    SEQUENCE     �   CREATE SEQUENCE public.applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.applications_application_id_seq;
       public               postgres    false    235            �           0    0    applications_application_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.applications_application_id_seq OWNED BY public.applications.application_id;
          public               postgres    false    234            �            1259    16472    criteria    TABLE     �   CREATE TABLE public.criteria (
    basvuru_id integer NOT NULL,
    faculty_id integer,
    kadro_id integer NOT NULL,
    min_puan numeric(5,2),
    departman_id integer
);
    DROP TABLE public.criteria;
       public         heap r       postgres    false            �            1259    16471    criteria_basvuru_id_seq    SEQUENCE     �   CREATE SEQUENCE public.criteria_basvuru_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.criteria_basvuru_id_seq;
       public               postgres    false    230            �           0    0    criteria_basvuru_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.criteria_basvuru_id_seq OWNED BY public.criteria.basvuru_id;
          public               postgres    false    229            �            1259    16497    criteria_documents    TABLE     o   CREATE TABLE public.criteria_documents (
    criteria_id integer NOT NULL,
    document_id integer NOT NULL
);
 &   DROP TABLE public.criteria_documents;
       public         heap r       postgres    false            �            1259    16426    departmanlar    TABLE     �   CREATE TABLE public.departmanlar (
    departman_id integer NOT NULL,
    departman_ad character varying(70),
    faculty_id integer
);
     DROP TABLE public.departmanlar;
       public         heap r       postgres    false            �            1259    16425    departmanlar_departman_id_seq    SEQUENCE     �   CREATE SEQUENCE public.departmanlar_departman_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.departmanlar_departman_id_seq;
       public               postgres    false    224            �           0    0    departmanlar_departman_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.departmanlar_departman_id_seq OWNED BY public.departmanlar.departman_id;
          public               postgres    false    223            �            1259    16489    document_category    TABLE     �   CREATE TABLE public.document_category (
    category_id integer NOT NULL,
    documents_id integer,
    aciklama text,
    puan integer
);
 %   DROP TABLE public.document_category;
       public         heap r       postgres    false            �            1259    16857 	   documents    TABLE     n   CREATE TABLE public.documents (
    documents_id integer NOT NULL,
    document_type character varying(70)
);
    DROP TABLE public.documents;
       public         heap r       postgres    false            �            1259    16488    documents_document_id_seq    SEQUENCE     �   CREATE SEQUENCE public.documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.documents_document_id_seq;
       public               postgres    false    232            �           0    0    documents_document_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.documents_document_id_seq OWNED BY public.document_category.category_id;
          public               postgres    false    231            �            1259    16856    documents_documents_id_seq    SEQUENCE     �   CREATE SEQUENCE public.documents_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.documents_documents_id_seq;
       public               postgres    false    246            �           0    0    documents_documents_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.documents_documents_id_seq OWNED BY public.documents.documents_id;
          public               postgres    false    245            �            1259    16571    evaluations    TABLE     �   CREATE TABLE public.evaluations (
    eval_id integer NOT NULL,
    jury_id integer,
    basvuru_id integer,
    rapor_url character varying(2048),
    karar character varying(8),
    tarih timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.evaluations;
       public         heap r       postgres    false            �            1259    16577    evaluations_eval_id_seq    SEQUENCE     �   CREATE SEQUENCE public.evaluations_eval_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.evaluations_eval_id_seq;
       public               postgres    false    238            �           0    0    evaluations_eval_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.evaluations_eval_id_seq OWNED BY public.evaluations.eval_id;
          public               postgres    false    239            �            1259    16419 	   faculties    TABLE     i   CREATE TABLE public.faculties (
    faculty_id integer NOT NULL,
    faculty_ad character varying(70)
);
    DROP TABLE public.faculties;
       public         heap r       postgres    false            �            1259    16418    faculties_faculty_id_seq    SEQUENCE     �   CREATE SEQUENCE public.faculties_faculty_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.faculties_faculty_id_seq;
       public               postgres    false    222            �           0    0    faculties_faculty_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.faculties_faculty_id_seq OWNED BY public.faculties.faculty_id;
          public               postgres    false    221            �            1259    16531    jury_members    TABLE     �   CREATE TABLE public.jury_members (
    jury_id integer NOT NULL,
    tc_kimlik character varying(11) NOT NULL,
    ad character varying(15),
    soyad character varying(20),
    unvan character varying(25),
    kurum character varying(100)
);
     DROP TABLE public.jury_members;
       public         heap r       postgres    false            �            1259    16530    jury_members_jury_id_seq    SEQUENCE     �   CREATE SEQUENCE public.jury_members_jury_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.jury_members_jury_id_seq;
       public               postgres    false    237            �           0    0    jury_members_jury_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.jury_members_jury_id_seq OWNED BY public.jury_members.jury_id;
          public               postgres    false    236            �            1259    16438    kadrolar    TABLE     y   CREATE TABLE public.kadrolar (
    kadro_id integer NOT NULL,
    kadro_ad character varying(30),
    descriptin text
);
    DROP TABLE public.kadrolar;
       public         heap r       postgres    false            �            1259    16437    kadrolar_kadro_id_seq    SEQUENCE     �   CREATE SEQUENCE public.kadrolar_kadro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.kadrolar_kadro_id_seq;
       public               postgres    false    226            �           0    0    kadrolar_kadro_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.kadrolar_kadro_id_seq OWNED BY public.kadrolar.kadro_id;
          public               postgres    false    225            �            1259    16773    notifications    TABLE     �   CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer,
    basvuru_id integer,
    mesaj text,
    gonderildi boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 !   DROP TABLE public.notifications;
       public         heap r       postgres    false            �            1259    16772 !   notifications_notification_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.notifications_notification_id_seq;
       public               postgres    false    241            �           0    0 !   notifications_notification_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;
          public               postgres    false    240            �            1259    16838    point_calculations    TABLE     l  CREATE TABLE public.point_calculations (
    calculation_id integer NOT NULL,
    application_id integer,
    toplam_puan numeric,
    a1_a2_puan numeric,
    a1_a4_puan numeric,
    a1_a5_puan numeric,
    a1_a6_puan numeric,
    a1_a8_puan numeric,
    baslica_yazar_count integer,
    calculation_date timestamp without time zone,
    calculation_json jsonb
);
 &   DROP TABLE public.point_calculations;
       public         heap r       postgres    false            �            1259    16837 %   point_calculations_calculation_id_seq    SEQUENCE     �   CREATE SEQUENCE public.point_calculations_calculation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 <   DROP SEQUENCE public.point_calculations_calculation_id_seq;
       public               postgres    false    244            �           0    0 %   point_calculations_calculation_id_seq    SEQUENCE OWNED BY     o   ALTER SEQUENCE public.point_calculations_calculation_id_seq OWNED BY public.point_calculations.calculation_id;
          public               postgres    false    243            �            1259    16390    roles    TABLE     ~   CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(15) NOT NULL,
    role_desc text
);
    DROP TABLE public.roles;
       public         heap r       postgres    false            �            1259    16389    roles_role_id_seq    SEQUENCE     �   CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.roles_role_id_seq;
       public               postgres    false    218            �           0    0    roles_role_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;
          public               postgres    false    217            �            1259    16401    users    TABLE       CREATE TABLE public.users (
    user_id integer NOT NULL,
    tc_kimlik character(11) NOT NULL,
    sifre character varying(15),
    ad character varying(15),
    soyad character varying(20),
    email character varying(30),
    telefon character varying(11),
    role_id integer
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    16400    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public               postgres    false    220            �           0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;
          public               postgres    false    219            �           2604    16578    announcements ilan_id    DEFAULT     ~   ALTER TABLE ONLY public.announcements ALTER COLUMN ilan_id SET DEFAULT nextval('public.announcements_ilan_id_seq'::regclass);
 D   ALTER TABLE public.announcements ALTER COLUMN ilan_id DROP DEFAULT;
       public               postgres    false    228    227    228            �           2604    16579    applications application_id    DEFAULT     �   ALTER TABLE ONLY public.applications ALTER COLUMN application_id SET DEFAULT nextval('public.applications_application_id_seq'::regclass);
 J   ALTER TABLE public.applications ALTER COLUMN application_id DROP DEFAULT;
       public               postgres    false    235    234    235            �           2604    16580    criteria basvuru_id    DEFAULT     z   ALTER TABLE ONLY public.criteria ALTER COLUMN basvuru_id SET DEFAULT nextval('public.criteria_basvuru_id_seq'::regclass);
 B   ALTER TABLE public.criteria ALTER COLUMN basvuru_id DROP DEFAULT;
       public               postgres    false    230    229    230            �           2604    16581    departmanlar departman_id    DEFAULT     �   ALTER TABLE ONLY public.departmanlar ALTER COLUMN departman_id SET DEFAULT nextval('public.departmanlar_departman_id_seq'::regclass);
 H   ALTER TABLE public.departmanlar ALTER COLUMN departman_id DROP DEFAULT;
       public               postgres    false    224    223    224            �           2604    16582    document_category category_id    DEFAULT     �   ALTER TABLE ONLY public.document_category ALTER COLUMN category_id SET DEFAULT nextval('public.documents_document_id_seq'::regclass);
 L   ALTER TABLE public.document_category ALTER COLUMN category_id DROP DEFAULT;
       public               postgres    false    232    231    232            �           2604    16860    documents documents_id    DEFAULT     �   ALTER TABLE ONLY public.documents ALTER COLUMN documents_id SET DEFAULT nextval('public.documents_documents_id_seq'::regclass);
 E   ALTER TABLE public.documents ALTER COLUMN documents_id DROP DEFAULT;
       public               postgres    false    246    245    246            �           2604    16583    evaluations eval_id    DEFAULT     z   ALTER TABLE ONLY public.evaluations ALTER COLUMN eval_id SET DEFAULT nextval('public.evaluations_eval_id_seq'::regclass);
 B   ALTER TABLE public.evaluations ALTER COLUMN eval_id DROP DEFAULT;
       public               postgres    false    239    238            �           2604    16584    faculties faculty_id    DEFAULT     |   ALTER TABLE ONLY public.faculties ALTER COLUMN faculty_id SET DEFAULT nextval('public.faculties_faculty_id_seq'::regclass);
 C   ALTER TABLE public.faculties ALTER COLUMN faculty_id DROP DEFAULT;
       public               postgres    false    222    221    222            �           2604    16585    jury_members jury_id    DEFAULT     |   ALTER TABLE ONLY public.jury_members ALTER COLUMN jury_id SET DEFAULT nextval('public.jury_members_jury_id_seq'::regclass);
 C   ALTER TABLE public.jury_members ALTER COLUMN jury_id DROP DEFAULT;
       public               postgres    false    237    236    237            �           2604    16586    kadrolar kadro_id    DEFAULT     v   ALTER TABLE ONLY public.kadrolar ALTER COLUMN kadro_id SET DEFAULT nextval('public.kadrolar_kadro_id_seq'::regclass);
 @   ALTER TABLE public.kadrolar ALTER COLUMN kadro_id DROP DEFAULT;
       public               postgres    false    226    225    226            �           2604    16776    notifications notification_id    DEFAULT     �   ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);
 L   ALTER TABLE public.notifications ALTER COLUMN notification_id DROP DEFAULT;
       public               postgres    false    240    241    241            �           2604    16841 !   point_calculations calculation_id    DEFAULT     �   ALTER TABLE ONLY public.point_calculations ALTER COLUMN calculation_id SET DEFAULT nextval('public.point_calculations_calculation_id_seq'::regclass);
 P   ALTER TABLE public.point_calculations ALTER COLUMN calculation_id DROP DEFAULT;
       public               postgres    false    244    243    244            �           2604    16587    roles role_id    DEFAULT     n   ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);
 <   ALTER TABLE public.roles ALTER COLUMN role_id DROP DEFAULT;
       public               postgres    false    218    217    218            �           2604    16588    users user_id    DEFAULT     n   ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    220    219    220            �          0    16447    announcements 
   TABLE DATA           �   COPY public.announcements (ilan_id, "ilan_baslık", ilan_aciklama, faculty_id, departman_id, kadro_id, baslangic_tarih, bitis_tarih) FROM stdin;
    public               postgres    false    228   �       �          0    16811    application_documents 
   TABLE DATA           �   COPY public.application_documents (application_id, document_id, dosya_url, upload_date, is_verified, is_baslica_yazar, verification_notes) FROM stdin;
    public               postgres    false    242   �       �          0    16513    applications 
   TABLE DATA           b   COPY public.applications (application_id, user_id, basvuru_id, basvuru_tarihi, durum) FROM stdin;
    public               postgres    false    235   4�       �          0    16472    criteria 
   TABLE DATA           \   COPY public.criteria (basvuru_id, faculty_id, kadro_id, min_puan, departman_id) FROM stdin;
    public               postgres    false    230   ~�       �          0    16497    criteria_documents 
   TABLE DATA           F   COPY public.criteria_documents (criteria_id, document_id) FROM stdin;
    public               postgres    false    233   ��       �          0    16426    departmanlar 
   TABLE DATA           N   COPY public.departmanlar (departman_id, departman_ad, faculty_id) FROM stdin;
    public               postgres    false    224   �       �          0    16489    document_category 
   TABLE DATA           V   COPY public.document_category (category_id, documents_id, aciklama, puan) FROM stdin;
    public               postgres    false    232   ��       �          0    16857 	   documents 
   TABLE DATA           @   COPY public.documents (documents_id, document_type) FROM stdin;
    public               postgres    false    246   ��       �          0    16571    evaluations 
   TABLE DATA           \   COPY public.evaluations (eval_id, jury_id, basvuru_id, rapor_url, karar, tarih) FROM stdin;
    public               postgres    false    238   �       �          0    16419 	   faculties 
   TABLE DATA           ;   COPY public.faculties (faculty_id, faculty_ad) FROM stdin;
    public               postgres    false    222   .�       �          0    16531    jury_members 
   TABLE DATA           S   COPY public.jury_members (jury_id, tc_kimlik, ad, soyad, unvan, kurum) FROM stdin;
    public               postgres    false    237   �       �          0    16438    kadrolar 
   TABLE DATA           B   COPY public.kadrolar (kadro_id, kadro_ad, descriptin) FROM stdin;
    public               postgres    false    226   6�       �          0    16773    notifications 
   TABLE DATA           l   COPY public.notifications (notification_id, user_id, basvuru_id, mesaj, gonderildi, created_at) FROM stdin;
    public               postgres    false    241   J�       �          0    16838    point_calculations 
   TABLE DATA           �   COPY public.point_calculations (calculation_id, application_id, toplam_puan, a1_a2_puan, a1_a4_puan, a1_a5_puan, a1_a6_puan, a1_a8_puan, baslica_yazar_count, calculation_date, calculation_json) FROM stdin;
    public               postgres    false    244   g�       �          0    16390    roles 
   TABLE DATA           >   COPY public.roles (role_id, role_name, role_desc) FROM stdin;
    public               postgres    false    218   ��       �          0    16401    users 
   TABLE DATA           ^   COPY public.users (user_id, tc_kimlik, sifre, ad, soyad, email, telefon, role_id) FROM stdin;
    public               postgres    false    220   j�       �           0    0    announcements_ilan_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.announcements_ilan_id_seq', 1, false);
          public               postgres    false    227            �           0    0    applications_application_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public.applications_application_id_seq', 1, false);
          public               postgres    false    234            �           0    0    criteria_basvuru_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.criteria_basvuru_id_seq', 1, false);
          public               postgres    false    229            �           0    0    departmanlar_departman_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.departmanlar_departman_id_seq', 1, false);
          public               postgres    false    223            �           0    0    documents_document_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.documents_document_id_seq', 90, true);
          public               postgres    false    231            �           0    0    documents_documents_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.documents_documents_id_seq', 1, false);
          public               postgres    false    245            �           0    0    evaluations_eval_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.evaluations_eval_id_seq', 1, false);
          public               postgres    false    239            �           0    0    faculties_faculty_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.faculties_faculty_id_seq', 1, false);
          public               postgres    false    221            �           0    0    jury_members_jury_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.jury_members_jury_id_seq', 1, false);
          public               postgres    false    236            �           0    0    kadrolar_kadro_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.kadrolar_kadro_id_seq', 5, true);
          public               postgres    false    225            �           0    0 !   notifications_notification_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, false);
          public               postgres    false    240            �           0    0 %   point_calculations_calculation_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public.point_calculations_calculation_id_seq', 1, false);
          public               postgres    false    243            �           0    0    roles_role_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.roles_role_id_seq', 4, true);
          public               postgres    false    217            �           0    0    users_user_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);
          public               postgres    false    219            �           2606    16455     announcements announcements_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (ilan_id);
 J   ALTER TABLE ONLY public.announcements DROP CONSTRAINT announcements_pkey;
       public                 postgres    false    228                       2606    16820 0   application_documents application_documents_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.application_documents
    ADD CONSTRAINT application_documents_pkey PRIMARY KEY (application_id, document_id);
 Z   ALTER TABLE ONLY public.application_documents DROP CONSTRAINT application_documents_pkey;
       public                 postgres    false    242    242                       2606    16519    applications applications_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (application_id);
 H   ALTER TABLE ONLY public.applications DROP CONSTRAINT applications_pkey;
       public                 postgres    false    235            �           2606    16501 *   criteria_documents criteria_documents_pkey 
   CONSTRAINT     ~   ALTER TABLE ONLY public.criteria_documents
    ADD CONSTRAINT criteria_documents_pkey PRIMARY KEY (criteria_id, document_id);
 T   ALTER TABLE ONLY public.criteria_documents DROP CONSTRAINT criteria_documents_pkey;
       public                 postgres    false    233    233            �           2606    16477    criteria criteria_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.criteria
    ADD CONSTRAINT criteria_pkey PRIMARY KEY (basvuru_id);
 @   ALTER TABLE ONLY public.criteria DROP CONSTRAINT criteria_pkey;
       public                 postgres    false    230            �           2606    16431    departmanlar departmanlar_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.departmanlar
    ADD CONSTRAINT departmanlar_pkey PRIMARY KEY (departman_id);
 H   ALTER TABLE ONLY public.departmanlar DROP CONSTRAINT departmanlar_pkey;
       public                 postgres    false    224            �           2606    16496     document_category documents_pkey 
   CONSTRAINT     g   ALTER TABLE ONLY public.document_category
    ADD CONSTRAINT documents_pkey PRIMARY KEY (category_id);
 J   ALTER TABLE ONLY public.document_category DROP CONSTRAINT documents_pkey;
       public                 postgres    false    232                       2606    16864    documents documents_pkey1 
   CONSTRAINT     a   ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey1 PRIMARY KEY (documents_id);
 C   ALTER TABLE ONLY public.documents DROP CONSTRAINT documents_pkey1;
       public                 postgres    false    246                       2606    16590    evaluations evaluations_pkey 
   CONSTRAINT     _   ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (eval_id);
 F   ALTER TABLE ONLY public.evaluations DROP CONSTRAINT evaluations_pkey;
       public                 postgres    false    238            �           2606    16424    faculties faculties_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (faculty_id);
 B   ALTER TABLE ONLY public.faculties DROP CONSTRAINT faculties_pkey;
       public                 postgres    false    222                       2606    16536    jury_members jury_members_pkey 
   CONSTRAINT     a   ALTER TABLE ONLY public.jury_members
    ADD CONSTRAINT jury_members_pkey PRIMARY KEY (jury_id);
 H   ALTER TABLE ONLY public.jury_members DROP CONSTRAINT jury_members_pkey;
       public                 postgres    false    237                       2606    16538 '   jury_members jury_members_tc_kimlik_key 
   CONSTRAINT     g   ALTER TABLE ONLY public.jury_members
    ADD CONSTRAINT jury_members_tc_kimlik_key UNIQUE (tc_kimlik);
 Q   ALTER TABLE ONLY public.jury_members DROP CONSTRAINT jury_members_tc_kimlik_key;
       public                 postgres    false    237            �           2606    16445    kadrolar kadrolar_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.kadrolar
    ADD CONSTRAINT kadrolar_pkey PRIMARY KEY (kadro_id);
 @   ALTER TABLE ONLY public.kadrolar DROP CONSTRAINT kadrolar_pkey;
       public                 postgres    false    226            	           2606    16782     notifications notifications_pkey 
   CONSTRAINT     k   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);
 J   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
       public                 postgres    false    241                       2606    16845 *   point_calculations point_calculations_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.point_calculations
    ADD CONSTRAINT point_calculations_pkey PRIMARY KEY (calculation_id);
 T   ALTER TABLE ONLY public.point_calculations DROP CONSTRAINT point_calculations_pkey;
       public                 postgres    false    244            �           2606    16397    roles roles_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);
 :   ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
       public                 postgres    false    218            �           2606    16399    roles roles_role_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);
 C   ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_role_name_key;
       public                 postgres    false    218            �           2606    16410    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    220            �           2606    16406    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    220            �           2606    16408    users users_tc_kimlik_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tc_kimlik_key UNIQUE (tc_kimlik);
 C   ALTER TABLE ONLY public.users DROP CONSTRAINT users_tc_kimlik_key;
       public                 postgres    false    220            �           2606    16412    users users_telefon_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_telefon_key UNIQUE (telefon);
 A   ALTER TABLE ONLY public.users DROP CONSTRAINT users_telefon_key;
       public                 postgres    false    220            $           2620    16794 #   evaluations after_evaluation_insert    TRIGGER     �   CREATE TRIGGER after_evaluation_insert AFTER INSERT ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.notify_admin_when_all_evaluations_done();
 <   DROP TRIGGER after_evaluation_insert ON public.evaluations;
       public               postgres    false    238    258                       2606    16461 -   announcements announcements_departman_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_departman_id_fkey FOREIGN KEY (departman_id) REFERENCES public.departmanlar(departman_id);
 W   ALTER TABLE ONLY public.announcements DROP CONSTRAINT announcements_departman_id_fkey;
       public               postgres    false    4853    224    228                       2606    16456 +   announcements announcements_faculty_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(faculty_id);
 U   ALTER TABLE ONLY public.announcements DROP CONSTRAINT announcements_faculty_id_fkey;
       public               postgres    false    222    228    4851                       2606    16466 )   announcements announcements_kadro_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_kadro_id_fkey FOREIGN KEY (kadro_id) REFERENCES public.kadrolar(kadro_id);
 S   ALTER TABLE ONLY public.announcements DROP CONSTRAINT announcements_kadro_id_fkey;
       public               postgres    false    226    228    4855            !           2606    16821 ?   application_documents application_documents_application_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.application_documents
    ADD CONSTRAINT application_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id) ON DELETE CASCADE;
 i   ALTER TABLE ONLY public.application_documents DROP CONSTRAINT application_documents_application_id_fkey;
       public               postgres    false    235    4865    242            "           2606    16826 <   application_documents application_documents_document_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.application_documents
    ADD CONSTRAINT application_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document_category(category_id) ON DELETE CASCADE;
 f   ALTER TABLE ONLY public.application_documents DROP CONSTRAINT application_documents_document_id_fkey;
       public               postgres    false    232    242    4861                       2606    16525 )   applications applications_basvuru_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_basvuru_id_fkey FOREIGN KEY (basvuru_id) REFERENCES public.criteria(basvuru_id);
 S   ALTER TABLE ONLY public.applications DROP CONSTRAINT applications_basvuru_id_fkey;
       public               postgres    false    4859    235    230                       2606    16520 &   applications applications_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 P   ALTER TABLE ONLY public.applications DROP CONSTRAINT applications_user_id_fkey;
       public               postgres    false    4845    235    220                       2606    16795 #   criteria criteria_departman_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.criteria
    ADD CONSTRAINT criteria_departman_id_fkey FOREIGN KEY (departman_id) REFERENCES public.departmanlar(departman_id);
 M   ALTER TABLE ONLY public.criteria DROP CONSTRAINT criteria_departman_id_fkey;
       public               postgres    false    4853    230    224                       2606    16502 6   criteria_documents criteria_documents_criteria_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.criteria_documents
    ADD CONSTRAINT criteria_documents_criteria_id_fkey FOREIGN KEY (criteria_id) REFERENCES public.criteria(basvuru_id) ON DELETE CASCADE;
 `   ALTER TABLE ONLY public.criteria_documents DROP CONSTRAINT criteria_documents_criteria_id_fkey;
       public               postgres    false    233    4859    230                       2606    16507 6   criteria_documents criteria_documents_document_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.criteria_documents
    ADD CONSTRAINT criteria_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document_category(category_id) ON DELETE CASCADE;
 `   ALTER TABLE ONLY public.criteria_documents DROP CONSTRAINT criteria_documents_document_id_fkey;
       public               postgres    false    232    4861    233                       2606    16478 !   criteria criteria_faculty_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.criteria
    ADD CONSTRAINT criteria_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(faculty_id);
 K   ALTER TABLE ONLY public.criteria DROP CONSTRAINT criteria_faculty_id_fkey;
       public               postgres    false    222    230    4851                       2606    16483    criteria criteria_kadro_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.criteria
    ADD CONSTRAINT criteria_kadro_id_fkey FOREIGN KEY (kadro_id) REFERENCES public.kadrolar(kadro_id);
 I   ALTER TABLE ONLY public.criteria DROP CONSTRAINT criteria_kadro_id_fkey;
       public               postgres    false    226    230    4855                       2606    16432 )   departmanlar departmanlar_faculty_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.departmanlar
    ADD CONSTRAINT departmanlar_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(faculty_id);
 S   ALTER TABLE ONLY public.departmanlar DROP CONSTRAINT departmanlar_faculty_id_fkey;
       public               postgres    false    222    224    4851                       2606    16870 5   document_category document_category_documents_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.document_category
    ADD CONSTRAINT document_category_documents_id_fkey FOREIGN KEY (documents_id) REFERENCES public.documents(documents_id);
 _   ALTER TABLE ONLY public.document_category DROP CONSTRAINT document_category_documents_id_fkey;
       public               postgres    false    246    232    4879                       2606    16591 '   evaluations evaluations_basvuru_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_basvuru_id_fkey FOREIGN KEY (basvuru_id) REFERENCES public.criteria(basvuru_id);
 Q   ALTER TABLE ONLY public.evaluations DROP CONSTRAINT evaluations_basvuru_id_fkey;
       public               postgres    false    230    238    4859                       2606    16596 $   evaluations evaluations_jury_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_jury_id_fkey FOREIGN KEY (jury_id) REFERENCES public.jury_members(jury_id);
 N   ALTER TABLE ONLY public.evaluations DROP CONSTRAINT evaluations_jury_id_fkey;
       public               postgres    false    238    4867    237                       2606    16788 +   notifications notifications_basvuru_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_basvuru_id_fkey FOREIGN KEY (basvuru_id) REFERENCES public.criteria(basvuru_id);
 U   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_basvuru_id_fkey;
       public               postgres    false    4859    241    230                        2606    16783 (   notifications notifications_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 R   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_user_id_fkey;
       public               postgres    false    4845    220    241            #           2606    16846 9   point_calculations point_calculations_application_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.point_calculations
    ADD CONSTRAINT point_calculations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id);
 c   ALTER TABLE ONLY public.point_calculations DROP CONSTRAINT point_calculations_application_id_fkey;
       public               postgres    false    244    235    4865                       2606    16413    users users_role_id_fkey    FK CONSTRAINT     |   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_role_id_fkey;
       public               postgres    false    218    220    4839            �     x���=k�0�g�W�d�.�c!c���������pr
�/�]�%S6)�����&K@�����6��[�p�9�O�6�u,�w�4�����EؠJc�T�}:��h�h4q8����2�'񦥗�`��Y��:�WyŁ����x����y���N���!Mt�j�<	��T	��^�2|H���Ia��?\�/N�K��B%3*�>�Jufi)m�:��^#FM)i�5���^�O6 �;�9y��D�	��<˲/����      �      x������ � �      �   :   x�3�4B##S]]c+0�60�tJ��I�MMI�2�A�ʌ8����=...  v�      �   /   x�3�4�4�0�30�4�2�L9�@<#K.# ט������� �7�      �   :   x���  �w�[m�q�9��%`L�Q4#8��ה�ڌ,��qE_��[ >��
�      �   �  x�mQ���@��_�?����_���3�K�ļ�هI@���*�=����p�����r93��[����|�x��s��*`��No�q�aV��ņ6�t�;u5��-�)��N�g��C�#�v��J������Co9`��9u�S�����L ����?���Ž8�)ca������2��䮔���|@n��T��a�U:X(3���|��A�<����Ǟ*X*��'<QC_ٳ��v��rz%��Ez}�/�b#
�D�	<�:Ӳ�̈�Q?���j���V�����}���.�l	���n�g�'�4G*GrП���2s��Pv&��8t`�~l`+�|�{��NήB6�owJe�
,3��� T,�-:�4z����''A�w���^��KX�C���-��{����      �   <  x��Y�n�F]�_1KPb�=Е\�M��hcga���9q�$�2 }HV�̶�x�����MZJ�٘6�ι�>���Z-����^�Ov/Ɯ�_᷐S/f*�d��w2:l�ǋYq���)�y�#�N�l�$⚇,�Oŕ��S�ݴ[��S��*��|>En�"�ZϧȫU����,�
\�-��� �%��d8J��z�x�Rb�y���@.�B3��f�ш-��	�M����߷�����*	���G�#Ev���6��� 2--��P]��XΎ�72�q*"�%Cl�3�����$���p�#5�rv�,��@�nF&WD$�L'J�Ky�RKʌ�ϋ���ޥ���s�#��of��"�~;��;��0I3��6�@�v�% ��Cţc������Ѷ]�0�c"�ٮ��0QwZ4��A�vS�>�0��G1K�Wr��q���8��|���b����	C=�P�F� �F��|>z���C�P2x�F�<`�L�|>*�zW���&��M�V��Fm~/2t)ȏ���[e� jvn{m��bwmw��V�}4�,�����u:�L>N��.�ȳ�!#$�,�����\��Aq�J��6aIH�,�#�@�!Ub��f)_L#N������`Ge��Bg!-�l�Ż�A��ґHў��P-*U�{�?r���-��]>W��i��σ�JX�ш�|�d��yL��W����Wȇ���=���xLe��v*7����J����;�}�DͅƀF"�3����nL6�~}�.��B���I�	m�-������d'כv�2¨"���kj�']��	�B:�08�^�y��3���t6��}i�ҁ���>��}2��H�Y��<�Q�~@ SaG��#���A'�f�0\��J
핇�'�}1����eTV�
���5f�Mk{7'����ڰes2���ʑ�lo?&��:�o��!Ρ3�#���O	P��pu[\1��d{=�xS���4C���\�o�-�Cy�߲��Ef��g���,��ZP=�rܸZ̆g8(�+�!.�
:&�Ob�P�!�v�?(x,�Ԓ}���<LqX.;Bh����^Pנs��پ����oK�>
,��N�S��e�τʬ:�߆�Hoe	��e���@�j�����=�tDWr�[��[Bu!ѫԺ�i7�v�Զz��ƅ@kG�/|�a��&�Pvh�	�]�k��{�u��j; ��D�T����v���?����q6�ɝ���������� ���9��]�a��@*?����$htp�ö�����6��׎bt$h�ۡ7^�1�̥ o|竁��"�9V�7��7�����O��O���t�_I��=
���j�0{Ga��}
��i�*�g�&���_�}w18o���5��������4�f��i�0k�!��:�B������Dl:�ɭ�8��h5�/f㈯�'�F��C�G�p,˫��԰�h�������D	�
,�4A�o�mR:
����S�ʺ!��+"qv8�x�;�/
Á/�������M�*'�m�,ۭ��W���ݭL觷��[����uI���wņ�,��<��Q������ѝ/�̰4l)zj��Z���o�,h>��ٸ̈́�ҊO�κ���f�j�֏����yIIm�{dΚ��gO����������g1ŵ�Tq��(e���It<��2����_�R�p7��b�뻽z4s38�����P������q����y���s9m����,�����B�_�<�QG��؆]t3�X�@�>��f�E<Ҹ����2���V�8?N����|a(/��k5���v��K۶����+      �     x�e�=N�0���)| @d�/�ֻ���VY'��F28Yd��ARE�
�����:��73�}3�����9ݲ�ɜ�t�X�F�e��4�,�4�J��]�kӚ��i�y�M��S��X�B���sƓ�s4#$��أ��UAEUVy�8�1���ү��k��_�90�����}�����-9���ӡS�敪�њ`o��i��8�`��إ�㦡��}1�p��N{r��4�\"�y6��NZ���e�֏�Mo��B�7���      �      x������ � �      �   �   x�]�;n�@���S�a Z��N�f�#1�x��	_�+�ޝ7�b)����C�����kds���^��ZqT��o:%Å���Jư ���ߢ�22�$�#G�R���7��/�j��y�Be�M��|E�X��X�{�f��@�E_�ºkk�E�N�웓P2�+��	��9�R?��ٜ��_���ך+,}C替�2�e���?�Rzs��      �      x������ � �      �     x�}�=n�@�k�s �@�Re�@�iҥ�e�?�K�A\`�Z�+u�$%�Q�BA��曙w�}8�}���Vk͆�^[	�F�J!�e_�:G��ר��邧V:&6\�SC��v�u�6|�-w����RÚ�8���VW4<�}��7��r��D�Y�T�c�r�q�`�1��7��2����y��c�"#�Tb�~>q�8<����[��w8����_ý�@�;��91QC����᩠�Pd�7u��*A����v8�������Na��%�+ ñ�:A+��ug/�#D�Q�7�v���:��!�p��"��}	Տ�� 43鿀��1���ݿR��v���P� ��-���<�(Xz{��4����ʊ?��ˆGd�G�Ⱦv�&�z��<��{�V�r��&3���4�28�͔����x(Qܚ�p_��e'��o|C�mv��*�4K�U���L���e~�`"�;Ŗ�`��y������7ÐP'T�ƚ������B�[���8�Ü      �      x������ � �      �      x������ � �      �   �   x�e�;n�@D��S��S��PZ� DQ%؜%��5��i}/3r~��-vf���6���|���:��0*�rz#ʤЌ�2�e�h��.�m0Q��k� Tx����q��m�!�,G��kO���x 2V�����u����!
;R_3�U�'!�S7�M|�����L=���ү�cv�d�釘�L�2��Z�}��?��{��/J��      �   �   x�]�1�0���9Le'N�l00�1�D�@զH�ڃ0rv�½H��ߖ�G���9T�H*�V���y���qk���J�s�:��|��S Ԭ��4%H!��CN*D�X���a�L�|���Z�����eKǚT�ԗ"֖���m5v6��������yզ])�����?o     