import {
  Analytics01Icon,
  Award01Icon,
  Briefcase01Icon,
  CodeIcon,
  DatabaseIcon,
  Flag01Icon,
  Flowchart01Icon,
  GithubIcon,
  GlobeIcon,
  HierarchyIcon,
  InstagramIcon,
  Linkedin01Icon,
  Mail01Icon,
  Mic01Icon,
  Note01Icon,
  PaintBrush01Icon,
  SchoolIcon,
  UniversityIcon,
  UserGroupIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/** Nama ikon yang bisa dipilih dari CMS (field `icon`). */
export const ICONS = {
  school: SchoolIcon,
  university: UniversityIcon,
  code: CodeIcon,
  database: DatabaseIcon,
  chart: Analytics01Icon,
  users: UserGroupIcon,
  briefcase: Briefcase01Icon,
  flag: Flag01Icon,
  mic: Mic01Icon,
  design: PaintBrush01Icon,
  video: Video01Icon,
  notes: Note01Icon,
  flow: Flowchart01Icon,
  diagram: HierarchyIcon,
  award: Award01Icon,
} as const;

export const ICON_NAMES = Object.keys(ICONS) as (keyof typeof ICONS)[];

export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const icon = ICONS[name as keyof typeof ICONS] ?? Flag01Icon;
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} className={className} />;
}

const SOCIAL = {
  github: GithubIcon,
  linkedin: Linkedin01Icon,
  instagram: InstagramIcon,
  email: Mail01Icon,
  mail: Mail01Icon,
};

export function SocialIcon({ label, size = 22, className }: { label: string; size?: number; className?: string }) {
  const icon = SOCIAL[label.toLowerCase() as keyof typeof SOCIAL] ?? GlobeIcon;
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} className={className} />;
}
