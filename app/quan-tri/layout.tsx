import { KhungQuanTri } from "@/components/khung-quan-tri";

export default function QuanTriLayout({ children }: LayoutProps<"/quan-tri">) {
  return <KhungQuanTri>{children}</KhungQuanTri>;
}
