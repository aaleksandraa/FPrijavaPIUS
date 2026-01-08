import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Star, Users, Clock, Sparkles, ArrowRight, Play, Heart, Zap, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpisLandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 25]);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    { icon: Target, title: "Preciznost", desc: "Savršena tehnika puder obrva" },
    { icon: Heart, title: "Strast", desc: "Ljubav prema beauty industriji" },
    { icon: Zap, title: "Brzina", desc: "Brzo učenje sa rezultatima" },
    { icon: Trophy, title: "Uspjeh", desc: "Garantovani rezultati" }
  ];

  const testimonials = [
    { name: "Marija K.", text: "Nevjerovatna transformacija! Željka je pravi mentor.", rating: 5 },
    { name: "Ana S.", text: "Najbolja investicija u moju karijeru. Preporučujem!", rating: 5 },
    { name: "Petra M.", text: "Profesionalno, detaljno i sa puno ljubavi.", rating: 5 }
  ];

  const handleStartRegistration = () => {
    navigate('/registracija');
  };

  return (
    <div className="min-h-screen bg-black text-white font-['Poppins'] overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-[#d9a078]/5 rounded-full blur-3xl transition-all duration-1000"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#d9a078]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#d9a078]/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <motion.div
          style={{ y: y1 }}
          className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Floating Elements */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -top-10 -left-10 w-20 h-20 border border-[#d9a078]/30 rounded-full"
            />
            <motion.div
              animate={{
                rotate: -360,
                y: [0, -20, 0]
              }}
              transition={{
                rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -top-5 -right-5 w-16 h-16 bg-[#d9a078]/20 rounded-full blur-sm"
            />

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center bg-[#d9a078]/10 border border-[#d9a078]/30 rounded-full px-6 py-3 mb-6">
                <span className="text-[#d9a078] font-semibold">POSEBNA PONUDA</span>
              </div>

              <h1 className="text-7xl md:text-9xl font-black mb-6 leading-none">
                <motion.span
                  initial={{ backgroundPosition: "0% 50%" }}
                  animate={{ backgroundPosition: "100% 50%" }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  className="bg-gradient-to-r from-white via-[#d9a078] via-white to-[#d9a078] bg-[length:200%_100%] bg-clip-text text-transparent"
                >
                  PIUS
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-[#d9a078]"
                >
                  ACADEMY
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Transformišite svoju <span className="text-[#d9a078] font-semibold">strast</span> u
                <span className="text-[#d9a078] font-semibold"> profesiju</span> uz Željku Radičanin
              </motion.p>
            </motion.div>

            {/* Interactive Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              whileHover={{ scale: 1.02, rotateY: 5 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-[#d9a078]/30 rounded-3xl p-8 mb-8 max-w-2xl mx-auto relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#d9a078]/5 to-transparent opacity-50" />
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-6xl font-black text-[#d9a078] mb-4"
                >
                  1.800€
                </motion.div>
                <div className="text-gray-400 mb-6">Kompletna transformacija</div>

                {/* Special Offer */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-[#d9a078]/10 border border-[#d9a078]/50 rounded-2xl p-6 mb-6"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="h-6 w-6 text-[#d9a078]" />
                    <span className="text-[#d9a078] font-bold text-lg">RATE BEZ KAMATA</span>
                    <Sparkles className="h-6 w-6 text-[#d9a078]" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-[#d9a078]">400€</div>
                      <div className="text-gray-400">uplata u roku od 24h od datuma potpisivanja ugovora.</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">500€</div>
                      <div className="text-gray-400">do 01.11.</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">900€</div>
                      <div className="text-gray-400">do 01.12.</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 50px rgba(217, 160, 120, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartRegistration}
                className="group bg-gradient-to-r from-[#d9a078] to-[#c4956b] text-black px-10 py-5 rounded-full text-xl font-bold transition-all duration-300 flex items-center min-w-[320px] justify-center relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">PRIJAVI SE</span>
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform relative z-10" />
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-3 text-[#d9a078] cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#d9a078]/20 border border-[#d9a078] rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 ml-1" />
                </div>
                <span className="font-medium">Pogledaj demo</span>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="grid grid-cols-4 gap-8 max-w-2xl mx-auto"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 bg-[#d9a078]/10 border border-[#d9a078]/30 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#d9a078]/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-[#d9a078]" />
                  </div>
                  <div className="font-semibold text-sm text-white">{feature.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{feature.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section with Parallax */}
      <section className="relative py-32 overflow-hidden">
        <motion.div
          style={{ y: y2 }}
          className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  className="relative overflow-hidden rounded-3xl"
                >
                  <img
                    src="https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg"
                    alt="Željka Radičanin"
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-6 left-6 right-6"
                  >
                    <div className="bg-[#d9a078] text-black px-4 py-2 rounded-full text-sm font-bold inline-block">
                      15+ godina iskustva
                    </div>
                  </motion.div>
                </motion.div>

                {/* Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-6 -right-6 bg-black border border-[#d9a078]/30 rounded-2xl p-4 text-center"
                >
                  <div className="text-2xl font-bold text-[#d9a078]">500+</div>
                  <div className="text-xs text-gray-400">Zadovoljnih klijentica</div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold mb-8 leading-tight"
              >
                Upoznajte <span className="text-[#d9a078]">Željku</span>
                <br />
                <span className="text-gray-300">Vašu mentorku</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6 text-lg text-gray-300 leading-relaxed"
              >
                <p>
                  Svoju karijeru u trajnoj šminci gradim već više od <strong className="text-[#d9a078]">15 godina</strong>,
                  sa iskustvom širom Evrope, do Beča gdje sada živim i radim.
                </p>

                <p>
                  Moja misija je da svaka polaznica ne nauči samo tehniku, nego izgradi
                  <strong className="text-[#d9a078]"> samopouzdanje</strong> i pronađe podršku na svakom koraku.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-6 mt-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800/50 border border-[#d9a078]/20 rounded-xl p-6 text-center"
                >
                  <Star className="h-8 w-8 text-[#d9a078] mx-auto mb-3" />
                  <div className="font-bold text-white">Individualan pristup</div>
                  <div className="text-sm text-gray-400 mt-1">Mentorski odnos</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800/50 border border-[#d9a078]/20 rounded-xl p-6 text-center"
                >
                  <Users className="h-8 w-8 text-[#d9a078] mx-auto mb-3" />
                  <div className="font-bold text-white">Praktične vježbe</div>
                  <div className="text-sm text-gray-400 mt-1">Stvarni rezultati</div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-16"
          >
            Šta kažu naše <span className="text-[#d9a078]">polaznice</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-gray-800/50 border border-[#d9a078]/20 rounded-2xl p-8 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d9a078] to-[#c4956b]" />

                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-[#d9a078] fill-current" />
                  ))}
                </div>

                <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>

                <div className="font-semibold text-[#d9a078]">{testimonial.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-[#d9a078] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-[#d9a078] rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-6xl font-bold mb-8 leading-tight">
              Spremne za <span className="text-[#d9a078]">promjenu</span>?
            </h2>

            <p className="text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Pridružite se stotinama zadovoljnih polaznica koje su već transformisale svoju karijeru
            </p>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-[#d9a078]/10 border border-[#d9a078] rounded-3xl p-8 mb-12 max-w-md mx-auto"
            >
              <div className="text-[#d9a078] font-bold text-lg mb-2">OGRANIČENO VRIJEME</div>
              <div className="text-white font-semibold text-xl">Plaćanje na 3 rate bez kamata</div>
              <div className="text-gray-400 mt-2">Počnite sa samo 400€</div>
            </motion.div>

            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 60px rgba(217, 160, 120, 0.8)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartRegistration}
              className="bg-gradient-to-r from-[#d9a078] to-[#c4956b] text-black px-16 py-6 rounded-full text-2xl font-bold transition-all duration-300 mb-6 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.8 }}
              />
              <span className="relative z-10">PRIJAVI SE</span>
            </motion.button>

            <div className="flex items-center justify-center gap-3 text-[#d9a078]">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Ograničen broj mjesta - ne čekajte!</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
