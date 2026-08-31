import { KhungQuanTri } from "@/components/khung-quan-tri";

export default function QuanTriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KhungQuanTri>{children}</KhungQuanTri>;
}
