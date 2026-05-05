// script.js

document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================================
    // 1. CONFIGURAÇÕES DO CANVAS E PRELOADER
    // =========================================================
    const canvas = document.getElementById("hero-canvas");
    const ctx = canvas.getContext("2d");
    
    const preloader = document.getElementById("preloader");
    const loaderBar = document.getElementById("loader-bar");
    const loaderText = document.getElementById("loader-text");

    // Ajusta o tamanho intrínseco do canvas para a resolução original do vídeo
    canvas.width = 1920;
    canvas.height = 1080;

    const frameCount = 605; // Total de frames extraídos do ffmpeg
    const currentFrame = (index) => `assets/frames/frame_${index.toString().padStart(4, '0')}.jpg`;

    const images = [];
    
    // Objeto que o GSAP vai animar (a propriedade frame de 0 a frameCount - 1)
    const seq = {
        frame: 0
    };

    let loadedImages = 0;

    // Função de Preload de Imagens
    function preloadImages() {
        // Trava o scroll da página enquanto carrega
        document.body.style.overflow = 'hidden';

        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            
            img.onload = () => {
                loadedImages++;
                
                // Atualiza a UI do Preloader
                const progress = Math.round((loadedImages / frameCount) * 100);
                loaderBar.style.width = `${progress}%`;
                loaderText.innerText = `${progress}%`;

                // Quando todas as imagens carregarem, inicializa a experiência
                if (loadedImages === frameCount) {
                    initExperience();
                }
            };
            
            images.push(img);
        }
    }

    // Função para desenhar o frame atual no canvas
    function render() {
        if (images[seq.frame]) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(images[seq.frame], 0, 0, canvas.width, canvas.height);
        }
    }

    // =========================================================
    // 2. INICIALIZAÇÃO LENIS (Integração Correta)
    // =========================================================
    // Removidos os parâmetros customizados agressivos para usar o padrão fluido do Lenis
    const lenis = new Lenis({
        lerp: 0.1, // Padrão recomendado
        smoothWheel: true
    });

    // INTEGRAÇÃO GSAP & SCROLLTRIGGER COM LENIS
    gsap.registerPlugin(ScrollTrigger);
    
    // Atualiza o ScrollTrigger sempre que o Lenis realiza um scroll
    lenis.on('scroll', ScrollTrigger.update);

    // Usa SOMENTE o ticker do GSAP para rodar o Lenis (evita dupla renderização e bugs de física)
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    
    // Previne conflitos de lag smoothing entre GSAP e Lenis
    gsap.ticker.lagSmoothing(0);


    // =========================================================
    // 3. INICIA A EXPERIÊNCIA APÓS O PRELOAD
    // =========================================================
    function initExperience() {
        // Libera o scroll da página
        document.body.style.overflow = '';

        // Esconde o preloader suavemente
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            
            // CRÍTICO: Recalcula todas as posições do ScrollTrigger 
            // agora que o preloader saiu e o layout real está visível
            ScrollTrigger.refresh();
            
            // Inicializa as seções que dependem de posições corretas de scroll
            initArsenalAnimations();
            initRealmsScroll();
        }, 1000);

        // Renderiza o primeiro frame imediatamente
        render();

        // 3.1 ANIMAÇÕES DE ENTRADA (Hero Content)
        const tlReveal = gsap.timeline({ 
            defaults: { ease: "power3.out", duration: 1.4 } 
        });

        // Pequeno delay para a transição do preloader terminar antes de revelar
        tlReveal.to(".reveal-content > *", {
            y: 0,
            opacity: 1,
            stagger: 0.15, // Efeito cascata lindo e sutil
            delay: 0.3
        });

        // 3.2 SCROLL-DRIVEN CANVAS PLAYBACK
        gsap.to(seq, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: ".hero-section",
                start: "top top",
                end: "bottom bottom",
                // Quando usamos Lenis (que já suaviza o scroll), o scrub do GSAP
                // deve ser imediato (true) ou muito baixo para evitar o "peso" duplo.
                scrub: true, 
            },
            onUpdate: render
        });

        // 3.3 PARALLAX E EFEITOS
        
        // Efeito Parallax no Texto: Sobe suavemente e desaparece
        gsap.to(".hero-content", {
            y: -150, 
            opacity: 0, 
            ease: "power2.inOut",
            scrollTrigger: {
                trigger: ".hero-section",
                start: "10% top",
                end: "60% top",
                scrub: 1.2
            }
        });
        
        // Efeito Escala no Canvas: Um leve zoom conforme o tempo avança
        gsap.to(canvas, {
            scale: 1.15,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero-section",
                start: "top top",
                end: "bottom bottom",
                scrub: true
            }
        });
        
        // Esconde o indicador de scroll no início da rolagem
        gsap.to(".scroll-indicator", {
            opacity: 0,
            y: 20,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".hero-section",
                start: "5% top",
                end: "15% top",
                scrub: true
            }
        });

        // 3.4 POPUP QUOTES (Animação guiada por Scroll)
        
        // Frase 1: 05% a 20%
        const q1Tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero-section",
                start: "05% top",
                end: "20% top",
                scrub: true
            }
        });
        q1Tl.to("#quote-1", { y: 0, opacity: 1, duration: 1, ease: "power2.out" })
            .to("#quote-1", { y: -20, opacity: 0, duration: 1, ease: "power2.in" }, "+=0.5");

        // Frase 2: 25% a 40%
        const q2Tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero-section",
                start: "25% top",
                end: "40% top",
                scrub: true
            }
        });
        q2Tl.to("#quote-2", { y: 0, opacity: 1, duration: 1, ease: "power2.out" })
            .to("#quote-2", { y: -20, opacity: 0, duration: 1, ease: "power2.in" }, "+=0.5");

        // Frase 3 (Loki): 45% a 60%
        const q3Tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero-section",
                start: "45% top",
                end: "60% top",
                scrub: true
            }
        });
        q3Tl.to("#quote-3", { y: 0, opacity: 1, duration: 1, ease: "power2.out" })
            .to("#quote-3", { y: -20, opacity: 0, duration: 1, ease: "power2.in" }, "+=0.5");

        // Frase 4 (Amigo do trabalho): 65% a 80%
        const q4Tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero-section",
                start: "65% top",
                end: "80% top",
                scrub: true
            }
        });
        q4Tl.to("#quote-4", { y: 0, opacity: 1, duration: 1, ease: "power2.out" })
            .to("#quote-4", { y: -20, opacity: 0, duration: 1, ease: "power2.in" }, "+=0.5");

        // Frase 5 (Rei de Asgard): 85% a 98%
        const q5Tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero-section",
                start: "85% top",
                end: "98% top",
                scrub: true
            }
        });
        q5Tl.to("#quote-5", { y: 0, opacity: 1, duration: 1, ease: "power2.out" })
            .to("#quote-5", { y: -20, opacity: 0, duration: 1, ease: "power2.in" }, "+=0.5");
    }

    // =========================================================
    // 4. SEÇÃO ARSENAL (Dual Showcase)
    // =========================================================
    function initArsenalAnimations() {
        // Animação de revelação do container principal
        gsap.fromTo("#arsenal", 
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: "#arsenal",
                    start: "top 80%",
                }
            }
        );

        // Painéis das armas surgindo um após o outro (Stagger)
        gsap.fromTo(".weapon-panel", 
            { y: 80, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                stagger: 0.2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#arsenal",
                    start: "top 60%",
                }
            }
        );
    }

    // =========================================================
    // 5. SEÇÃO NOVE REINOS (Horizontal Scroll)
    // =========================================================
    function initRealmsScroll() {
        const wrapper = document.querySelector(".realms-wrapper");
        const slides = gsap.utils.toArray(".realm-slide");
        
        if (!wrapper || slides.length === 0) return;

        const isMobile = window.innerWidth < 768;

        // Ajusta a largura do wrapper dinamicamente
        wrapper.style.width = `${slides.length * 100}vw`;

        // Criamos o Tween horizontal principal
        const horizontalTween = gsap.to(wrapper, {
            x: () => -(wrapper.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                trigger: "#realms-scroll",
                pin: true,
                scrub: isMobile ? 0.5 : 1, // Mais responsivo no celular
                invalidateOnRefresh: true, // Recalcula ao girar a tela
                end: () => "+=" + (wrapper.scrollWidth - window.innerWidth),
                snap: {
                    snapTo: 1 / (slides.length - 1),
                    duration: { min: 0.15, max: 0.4 },
                    delay: 0.05,
                    ease: "power1.inOut"
                }
            }
        });

        // Animações individuais para cada slide conforme eles passam
        slides.forEach((slide, i) => {
            const content = slide.querySelector(".realm-content-box");
            const image = slide.querySelector(".realm-image-container img");
            const number = slide.querySelector(".absolute.top-1\\/2");
            const progressLabel = slide.querySelector(".absolute.bottom-12 span");
            const progressBar = slide.querySelector(".absolute.bottom-12 .bg-th-electric");

            // Atualiza o indicador de progresso (01/09, 02/09...)
            if (progressLabel) progressLabel.innerText = `${i.toString().padStart(2, '0')} / 09`;
            if (progressBar) progressBar.style.width = `${(i / (slides.length - 1)) * 100}%`;

            // Animação do conteúdo (Fade + Slide)
            if (content) {
                gsap.from(content, {
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: slide,
                        containerAnimation: horizontalTween,
                        start: "left 80%",
                        toggleActions: "play none none reverse"
                    }
                });
            }

            // Efeito Parallax na imagem do reino e Toggle de Classe para a Moldura
            if (image) {
                const parallaxAmount = isMobile ? 30 : 100;
                gsap.fromTo(image, 
                    { x: parallaxAmount, scale: isMobile ? 1 : 0.9 },
                    { 
                        x: -parallaxAmount, 
                        scale: isMobile ? 1.05 : 1.1, 
                        ease: "none",
                        scrollTrigger: {
                            trigger: slide,
                            containerAnimation: horizontalTween,
                            start: "left right",
                            end: "right left",
                            scrub: true
                        }
                    }
                );
                
                // Trigger separado para o toggle da classe quando o slide está no centro
                ScrollTrigger.create({
                    trigger: slide,
                    containerAnimation: horizontalTween,
                    start: "left center",
                    end: "right center",
                    onEnter: () => slide.classList.add("active-slide"),
                    onLeave: () => slide.classList.remove("active-slide"),
                    onEnterBack: () => slide.classList.add("active-slide"),
                    onLeaveBack: () => slide.classList.remove("active-slide")
                });
            }

            // Animação do número gigante
            if (number) {
                gsap.fromTo(number,
                    { scale: 0.5, opacity: 0 },
                    {
                        scale: 1.2,
                        opacity: 0.05,
                        ease: "power1.inOut",
                        scrollTrigger: {
                            trigger: slide,
                            containerAnimation: horizontalTween,
                            start: "left center",
                            end: "right center",
                            scrub: true
                        }
                    }
                );
            }
        });
        
        // Efeito de Parallax no Ghost Text de fundo (IX)
        gsap.to(".ghost-number", {
            x: -200,
            opacity: 0.1,
            scrollTrigger: {
                trigger: "#realms-scroll",
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // Dispara o carregamento das imagens da Hero ao abrir a página
    preloadImages();
});
