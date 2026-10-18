import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Socials = { label: string; url: string }[];

export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname").notNull(),
  tagline: text("tagline").notNull(),
  bio: text("bio").notNull(),
  campus: text("campus").notNull(),
  major: text("major").notNull(),
  batch: text("batch").notNull().default(""),
  location: text("location").notNull().default(""),
  email: text("email").notNull().default(""),
  photo: text("photo").notNull().default("/images/me-1.jpg"),
  cvUrl: text("cv_url").notNull().default(""),
  socials: jsonb("socials").$type<Socials>().notNull().default([]),
  /** Lagu latar showreel. Kosong = lagu bawaan. */
  showreelMusic: text("showreel_music").notNull().default(""),
  showreelMusicOn: boolean("showreel_music_on").notNull().default(true),
  /** Banner pengumuman di atas situs (mis. "Sedang mencari magang"). */
  bannerOn: boolean("banner_on").notNull().default(false),
  bannerText: text("banner_text").notNull().default(""),
  bannerCta: text("banner_cta").notNull().default(""),
  bannerUrl: text("banner_url").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Teks narasi tiap babak cerita di beranda. */
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  mascotLine: text("mascot_line").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull().default(""),
  role: text("role").notNull().default(""),
  year: text("year").notNull().default(""),
  cover: text("cover").notNull().default(""),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  tech: jsonb("tech").$type<string[]>().notNull().default([]),
  demoUrl: text("demo_url").notNull().default(""),
  repoUrl: text("repo_url").notNull().default(""),
  color: text("color").notNull().default("#a4161a"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: integer("level").notNull().default(70),
  icon: text("icon").notNull().default("code"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("organisasi"),
  title: text("title").notNull(),
  place: text("place").notNull(),
  start: text("start").notNull(),
  end: text("end").notNull().default("Sekarang"),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Milestone di babak "Perjalanan" (scroll horizontal). */
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("flag"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Profile = typeof profile.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type GalleryItem = typeof gallery.$inferSelect;
export type Message = typeof messages.$inferSelect;
