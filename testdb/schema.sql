drop table if exists user_habits cascade;
drop table if exists surveys cascade;
drop table if exists users cascade;

create table users(
  id serial primary key,
  username text not null,
  email text unique,
  phone text,
  coins int default 0,
  interest text,
  avatarurl text
);

create table surveys(
  id serial primary key,
  user_id int references users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  occupancy_level text not null,
  submitted_at timestamptz default now()
);

create table user_habits(
  id serial primary key,
  user_id int references users(id) on delete cascade,
  area_id text not null,
  created_at timestamptz default now()
);
