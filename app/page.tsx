import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import WhyYLingo from "@/components/landing/WhyYLingo";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <Features />
      <WhyYLingo />
      <CTA />
      <Footer />
    </main>
   
  );
}