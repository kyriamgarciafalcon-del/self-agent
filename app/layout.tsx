import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Self Agent｜日程管理',description:'清晰、从容的移动端日程管理。'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
