import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import DoctorsSection from './components/DoctorsSection';
import AppointmentSection from './components/AppointmentSection';
import TestimonialsSection from './components/TestimonialsSection';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <DoctorsSection />
        <AppointmentSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
