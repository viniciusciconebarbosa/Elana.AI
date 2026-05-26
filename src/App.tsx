import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { Suspense, useRef, useEffect, useState, lazy } from "react"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/interface/components/theme-provider"
import { ModelProvider } from "@/interface/context/ModelContext"
import { ApiKeysProvider } from "@/interface/context/ApiKeysContext"
import { ChatListProvider } from "@/interface/context/ChatListContext"
import { ToolsSettingsProvider } from "@/interface/context/ToolsSettingsContext"
import { DatabaseSettingsProvider } from "@/interface/context/DatabaseSettingsContext"
import { UserProfileProvider } from "@/interface/context/UserProfileContext"
import { TitleBar } from "@/interface/components/TitleBar"
import { AppSidebar } from "@/interface/components/app-sidebar"
import { LoadingIndicator } from "@/interface/components/chat/LoadingIndicator"

// Pages
import ChatPage from "@/pages/ChatPage"
import SettingsPage from "@/pages/SettingsPage"
const MemoriesPage = lazy(() => import("@/pages/MemoriesPage"))
const BrainPage = lazy(() => import("@/pages/BrainPage"))

import { SidebarProvider } from "@/interface/context/SidebarContext"

// Lazy loaded Settings Panels
const GeneralSettings      = lazy(() => import("@/interface/components/settings/general/GeneralSettings").then(m => ({ default: m.GeneralSettings })))
const ModelSettings        = lazy(() => import("@/interface/components/settings/models/ModelSettings").then(m => ({ default: m.ModelSettings })))
const DatabaseSettings     = lazy(() => import("@/interface/components/settings/database/DatabaseSettings").then(m => ({ default: m.DatabaseSettings })))
const ApiKeysSettings      = lazy(() => import("@/interface/components/settings/api-keys/ApiKeysSettings").then(m => ({ default: m.ApiKeysSettings })))
const ToolsSettings        = lazy(() => import("@/interface/components/settings/tools/ToolsSettings").then(m => ({ default: m.ToolsSettings })))
const AppearanceSettings   = lazy(() => import("@/interface/components/settings/appearance/AppearanceSettings").then(m => ({ default: m.AppearanceSettings })))
const NotificationsSettings = lazy(() => import("@/interface/components/settings/notifications/NotificationsSettings").then(m => ({ default: m.NotificationsSettings })))
const PrivacySettings      = lazy(() => import("@/interface/components/settings/privacy/PrivacySettings").then(m => ({ default: m.PrivacySettings })))
const DataSettings         = lazy(() => import("@/interface/components/settings/data/DataSettings").then(m => ({ default: m.DataSettings })))

function MainLayout() {
  return (
    <ChatListProvider>
      <SidebarProvider>
        <div className="flex flex-col md:flex-row h-full overflow-hidden w-full">
          <Suspense fallback={<div className="w-16 md:w-72 bg-sidebar border-r border-sidebar-border" />}>
            <AppSidebar />
          </Suspense>
          <main className="flex-1 overflow-hidden flex flex-col min-h-0 min-w-0">
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <Routes>
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/settings" element={<SettingsPage />}>
                  <Route index element={<Navigate to="general" replace />} />
                  <Route path="general" element={<GeneralSettings />} />
                  <Route path="models" element={<ModelSettings />} />
                  <Route path="chat-database" element={<DatabaseSettings />} />
                  <Route path="api-keys" element={<ApiKeysSettings />} />
                  <Route path="tools" element={<ToolsSettings />} />
                  <Route path="appearance" element={<AppearanceSettings />} />
                  <Route path="notifications" element={<NotificationsSettings />} />
                  <Route path="privacy" element={<PrivacySettings />} />
                  <Route path="data" element={<DataSettings />} />
                </Route>
                <Route path="/memories" element={<MemoriesPage />} />
                <Route path="/brain" element={<BrainPage />} />
                <Route path="*" element={<Navigate to="/chat?id=new" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ChatListProvider>
  )
}

const isMobileDevice = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export default function App() {
  return (
    <ThemeProvider
    
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <DatabaseSettingsProvider>
        <ApiKeysProvider>
          <ToolsSettingsProvider>
            <ModelProvider>
            <UserProfileProvider>
            <div id="app-container" className="relative flex flex-col h-screen w-screen overflow-hidden bg-background  border-black/20 border-t border-l border-r border-b pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
              {!isMobileDevice && <TitleBar />}
            <div className="flex-1 overflow-hidden relative">
              <Routes>
                <Route path="/*" element={<MainLayout />} />
              </Routes>
            </div>
            </div>
            <Toaster />
            </UserProfileProvider>
          </ModelProvider>
          </ToolsSettingsProvider>
        </ApiKeysProvider>
      </DatabaseSettingsProvider>
    </ThemeProvider>
  )
}
