# Graph Report - src  (2026-10-18)

## Corpus Check
- Corpus is ~18,681 words - fits in a single context window. You may not need a graph.

## Summary
- 271 nodes · 648 edges · 10 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- CMS Server Actions
- Story Chapters & Mascot
- CMS Panel Pages
- Layouts & Project Pages
- Contact, Icons & Lottie
- Remotion Showreel
- Admin Session Auth
- Sky & Parallax Landscape
- Database Seeding
- shadcn Button

## God Nodes (most connected - your core abstractions)
1. `cn()` - 23 edges
2. `requireAdmin()` - 10 edges
3. `Mascot()` - 9 edges
4. `SpeechBubble()` - 9 edges
5. `isEntityKey()` - 9 edges
6. `Chapter` - 9 edges
7. `db` - 8 edges
8. `storageReady()` - 8 edges
9. `Showreel` - 8 edges
10. `saveEntity()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `PanelLayout()` --calls--> `requireAdmin()`  [EXTRACTED]
  app/admin/(panel)/layout.tsx → lib/auth.ts
- `IconField()` --calls--> `cn()`  [EXTRACTED]
  components/admin/EntityForm.tsx → lib/utils.ts
- `FieldInput()` --calls--> `cn()`  [EXTRACTED]
  components/admin/EntityForm.tsx → lib/utils.ts
- `ContactChapter()` --indirect_call--> `sendMessage()`  [INFERRED]
  components/story/ContactChapter.tsx → app/actions.ts
- `generateMetadata()` --calls--> `isEntityKey()`  [EXTRACTED]
  app/admin/(panel)/[entity]/page.tsx → lib/cms/config.ts

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "CMS Server Actions"
Cohesion: 0.07
Nodes (48): changePassword(), deleteEntity(), deleteMessage(), FormState, login(), logout(), readField(), refreshSite() (+40 more)

### Community 1 - "Story Chapters & Mascot"
Cohesion: 0.07
Nodes (43): HomePage(), revalidate, Icon(), Mascot(), MascotPose, Props, SpeechBubble(), AboutChapter() (+35 more)

### Community 2 - "CMS Panel Pages"
Cohesion: 0.10
Nodes (34): metadata, PanelLayout(), fmt, metadata, fmt, metadata, Sidebar(), CmsTable (+26 more)

### Community 3 - "Layouts & Project Pages"
Cohesion: 0.11
Nodes (18): metadata, app_globals, body, display, metadata, mono, generateMetadata(), generateStaticParams() (+10 more)

### Community 4 - "Contact, Icons & Lottie"
Cohesion: 0.13
Nodes (15): ContactState, schema, sendMessage(), NAV, ICON_NAMES, ICONS, SOCIAL, SocialIcon() (+7 more)

### Community 5 - "Remotion Showreel"
Cohesion: 0.18
Nodes (14): ReelChapter(), HomeData, ref_remotion, ref_remotion_player, Campus(), ease, Intro(), Outro() (+6 more)

### Community 6 - "Admin Session Auth"
Cohesion: 0.27
Nodes (11): createSession(), getSession(), key(), SESSION_COOKIE, SESSION_TTL_SECONDS, SessionPayload, signSession(), verifySession() (+3 more)

### Community 7 - "Sky & Parallax Landscape"
Cohesion: 0.22
Nodes (9): CityLayer(), Cloud(), FarHills(), NearGround(), rand(), SKY, SkyBackdrop(), SkyTime (+1 more)

### Community 8 - "Database Seeding"
Cohesion: 0.29
Nodes (7): db, isEmpty(), main(), sql, ref_bcryptjs, ref_dotenv, ref_postgres

### Community 9 - "shadcn Button"
Cohesion: 0.40
Nodes (5): Button(), buttonVariants, ref_base_ui_react, ref_class_variance_authority, ref_cn

## Knowledge Gaps
- **43 isolated node(s):** `revalidate`, `revalidate`, `schema`, `metadata`, `metadata` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 76 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Story Chapters & Mascot` to `CMS Server Actions`, `CMS Panel Pages`, `Layouts & Project Pages`, `Contact, Icons & Lottie`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `db` connect `CMS Panel Pages` to `CMS Server Actions`, `Contact, Icons & Lottie`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Profile` connect `CMS Panel Pages` to `Story Chapters & Mascot`, `Contact, Icons & Lottie`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `revalidate`, `revalidate`, `schema` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CMS Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.06538461538461539 - nodes in this community are weakly interconnected._
- **Should `Story Chapters & Mascot` be split into smaller, more focused modules?**
  _Cohesion score 0.07244843997884717 - nodes in this community are weakly interconnected._
- **Should `CMS Panel Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._