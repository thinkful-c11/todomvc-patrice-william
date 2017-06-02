create table items(
  id serial NOT NULL,
  title  text    NOT NULL,
  completed Boolean NOT NULL DEFAULT 'false',
  url text,
  CONSTRAINT items_pkey PRIMARY KEY ( id )
);
