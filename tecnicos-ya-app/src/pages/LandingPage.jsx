import { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import './App.css'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import Categories from '../components/Categories'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import CTA from '../components/CTA'
import ContactForm from '../components/ContactForm'
import Footer from '../components/Footer'
import AdBanner from '../components/AdBanner'
import { useToast } from '../hooks/useToast'

export default function LandingPage() {
  const form = useRef(null)
  const { toast, showToast } = useToast()
  const [sending, setSending] = useState(false)
  const [selectedType, setSelectedType] = useState('')

  const sendEmail = (e) => {
    e.preventDefault()
    setSending(true)
    const serviceId = 'service_8sm5cgq'
    const templateId = 'template_7tj6v2e'
    const publicKey = 'QKjumPpHwgQyCDZXH'

    emailjs.sendForm(serviceId, templateId, form.current, publicKey)
      .then(() => {
        showToast('¡Solicitud enviada exitosamente! Te contactaremos pronto.')
        form.current.reset()
        setSelectedType('')
      })
      .catch(() => {
        showToast('Error al enviar. Por favor intenta de nuevo.', 'error')
      })
      .finally(() => setSending(false))
  }

  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdBanner 
          type="promo" 
          text="🚀 ¡Lanza tu negocio técnico hoy mismo!" 
          ctaText="Registrarme" 
          link="/register"
          image="https://cdn-icons-png.flaticon.com/512/1063/1063376.png"
        />
      </div>

      <Categories />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
      <ContactForm
        formRef={form}
        sending={sending}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onSubmit={sendEmail}
      />
      <Footer />
    </>
  )
}


