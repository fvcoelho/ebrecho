export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') {
    return <div>Not available in production</div>;
  }
  return <>{children}</>;
}