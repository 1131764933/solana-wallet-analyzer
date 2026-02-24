import "./globals.css";

export const metadata = {
  title: "Solana钱包分析工具",
  description: "输入地址，一键生成可视化资产报告",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
