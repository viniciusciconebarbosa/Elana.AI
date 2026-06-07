import { Database, User, Briefcase, GraduationCap, Plane, Heart, MapPin } from "lucide-react"

export interface CategoryMeta {
  id: string
  icon: typeof Database
}

export const CATEGORIES_META: CategoryMeta[] = [
  { id: "all", icon: Database },
  { id: "personal", icon: User },
  { id: "work", icon: Briefcase },
  { id: "education", icon: GraduationCap },
  { id: "travel", icon: Plane },
  { id: "relationships", icon: Heart },
  { id: "locations", icon: MapPin },
]
