import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Self Agent｜个人生活操作系统',description:'统一记录日程与生活数据，让每一天更有秩序。'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
