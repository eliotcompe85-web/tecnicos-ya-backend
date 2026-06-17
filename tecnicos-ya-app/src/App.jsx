import { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import './App.css'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Categories from './components/Categories'
import Features from './components/Features'
import Pricing from './components/Pricing'
import Testimonials from './components/Testimonials'
import CTA from './components/CTA'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'
import Toast from './components/Toast'
import { useToast } from './hooks/useToast'

export default function App() {
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
      <Toast toast={toast} />
    </>
  )
}
