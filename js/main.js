// --- NAVEGACIÓN SPA ---
        function navigateTo(viewId) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active-link'));
            document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('active'));
            
            document.getElementById('view-' + viewId).classList.add('active');
            
            const link = document.querySelector(`.nav-links a[onclick="navigateTo('${viewId}')"]`);
            if(link) {
                link.classList.add('active-link');
                const parentDropdown = link.closest('.dropdown');
                if(parentDropdown) {
                    parentDropdown.querySelector('.dropdown-toggle').classList.add('active-link');
                }
            }
            
            document.getElementById('navLinks').classList.remove('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');

        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        function toggleDropdown(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const parent = e.target.closest('.dropdown');
                parent.classList.toggle('active');
            }
        }

        // --- SISTEMA DE MONEDA AUTOMÁTICO EN TIEMPO REAL ---
        let currentCurrency = 'USD';
        let currentRate = 1;

        async function initCurrencyAndPrices() {
            try {
                const ipResponse = await fetch('https://ipapi.co/json/');
                const ipData = await ipResponse.json();
                
                const userCurrency = ipData.currency || 'USD';
                const countryCode = ipData.country_code || 'US';

                document.getElementById('flagImg').src = `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
                document.getElementById('currencyText').innerText = userCurrency + ' ';

                const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
                const rateData = await rateResponse.json();

                if (rateData && rateData.rates && rateData.rates[userCurrency]) {
                    currentCurrency = userCurrency;
                    currentRate = rateData.rates[userCurrency];
                }

                updateAllPrices();

            } catch (error) {
                console.error('Error detectando moneda, cargando precios base en USD.', error);
                currentCurrency = 'USD';
                currentRate = 1;
                document.getElementById('currencyText').innerText = 'USD ';
                updateAllPrices();
            }
        }

        function updateAllPrices() {
            document.querySelectorAll('.dynamic-price').forEach(el => {
                const baseUsd = parseFloat(el.getAttribute('data-usd'));
                if (isNaN(baseUsd)) return;
                
                const converted = baseUsd * currentRate;
                
                const formatter = new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: ['COP', 'CLP', 'PYG'].includes(currentCurrency) ? 0 : 2,
                    maximumFractionDigits: ['COP', 'CLP', 'PYG'].includes(currentCurrency) ? 0 : 2
                });
                
                const symbol = currentCurrency === 'EUR' ? '€' : '$';
                el.innerText = symbol + formatter.format(converted) + ' ' + currentCurrency;
            });
        }
        
        initCurrencyAndPrices();


        // --- MOTOR INTELIGENTE DE PRODUCTO Y CARRITO ---
        let currentProduct = { title: '', priceUsd: 0, image: '', selectedDate: '', type: '' };
        let cart = [];

        function openProduct(card) {
            // Prevenir clic si la tarjeta está agotada
            if(card.querySelector('.sold-out-badge')) {
                alert('Este servicio se encuentra temporalmente agotado. Por favor, revisa más adelante o contáctame por WhatsApp para emergencias.');
                return;
            }

            const title = card.querySelector('.product-title').innerText;
            const priceUsd = card.querySelector('.dynamic-price').getAttribute('data-usd');
            const imageSrc = card.querySelector('.product-image').src;
            const payload = card.querySelector('.product-payload');
            
            const type = payload.querySelector('.p-type').innerText;
            const duration = payload.querySelector('.p-duration').innerText;
            const desc = payload.querySelector('.p-desc').innerHTML;
            const includes = payload.querySelector('.p-includes').innerHTML;
            
            const preTitle = card.querySelector('.pre-title') ? card.querySelector('.pre-title').innerText : 'Leo';
            const subtitle = card.querySelector('.product-subtitle') ? card.querySelector('.product-subtitle').innerText : '';

            currentProduct = { title, priceUsd: parseFloat(priceUsd), image: imageSrc, selectedDate: '', type };

            document.getElementById('detailTitle').innerText = title;
            document.getElementById('detailImage').src = imageSrc;
            document.getElementById('detailPrice').setAttribute('data-usd', priceUsd);
            document.getElementById('detailPreTitle').innerText = preTitle;
            document.getElementById('detailSubtitle').innerText = subtitle;
            document.getElementById('detailDesc').innerHTML = desc;
            document.getElementById('detailIncludes').innerHTML = includes;

            document.getElementById('calSidebarImg').src = imageSrc;
            document.getElementById('calSidebarTitle').innerText = title;
            document.getElementById('formSidebarImg').src = imageSrc;
            document.getElementById('formSidebarTitle').innerText = title;

            const reservButton = document.getElementById('btnOpenFlow');

            if(type === 'tarot' || type === 'personalizada') {
                reservButton.innerText = 'Agendar sesión';
                document.getElementById('calSidebarDesc').innerText = 'Selecciona un día disponible en el calendario.';
                document.getElementById('calSidebarDuration').innerText = 'Duración: ' + duration;
                document.getElementById('calSidebarDuration').style.display = 'block';
                reservButton.onclick = openCalendarModal;
            } else {
                reservButton.innerText = 'Comprar acceso inmediato';
                reservButton.onclick = function() {
                    let mensaje = "";
                    if (type === 'pdf') {
                        mensaje = `Hola Leo, quiero comprar el material "${title}". ¿Me indicas cómo puedo pagar?`;
                    } else if (type === 'audio') {
                        mensaje = `Hola Leo, quiero adquirir la meditación "${title}". ¿Cómo puedo hacer el pago?`;
                    } else {
                        mensaje = `Hola Leo, quiero adquirir "${title}". ¿Me indicas cómo puedo hacer el pago?`;
                    }
                    const numeroWhatsApp = "0000000000"; 
                    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
                    window.open(url, '_blank');
                };
            }

            updateAllPrices();
            navigateTo('producto');
        }

        function toggleCart() {
            document.getElementById('cartDrawer').classList.toggle('open');
            renderCart();
        }

        function renderCart() {
            const body = document.getElementById('cartBody');
            const countEl = document.getElementById('cartCount');
            const headerCountEl = document.getElementById('cartHeaderCount');
            const subtotalEl = document.getElementById('cartSubtotal');
            
            countEl.innerText = cart.length;
            headerCountEl.innerText = cart.length;

            if (cart.length === 0) {
                body.innerHTML = '<p style="text-align: center; margin-top: 50px; color: var(--color-text-light);">Tu carrito está vacío</p>';
                subtotalEl.setAttribute('data-usd', 0);
                subtotalEl.innerText = '$0.00 ' + currentCurrency;
                updateAllPrices();
                return;
            }

            let html = '';
            let totalUsd = 0;

            cart.forEach((item, index) => {
                totalUsd += item.priceUsd;
                const dateLabel = (item.type === 'tarot' || item.type === 'personalizada') ? 'Fecha reservada:' : 'Entrega:';
                
                html += `
                    <div class="cart-item">
                        <img src="${item.image}" alt="Item">
                        <div class="cart-item-details">
                            <h4>${item.title}</h4>
                            <p style="color: var(--color-magenta); font-weight: bold; font-size: 0.85rem;">${dateLabel} ${item.selectedDate}</p>
                            <p style="margin-top:5px; font-weight:bold; font-size: 1.1rem;" class="dynamic-price" data-usd="${item.priceUsd}">...</p>
                        </div>
                        <button style="background:rgba(255,0,0,0.1); border-radius: 6px; border:none; color:red; cursor:pointer; padding: 12px; transition: background 0.3s;" onclick="removeFromCart(${index})" onmouseover="this.style.background='rgba(255,0,0,0.2)'" onmouseout="this.style.background='rgba(255,0,0,0.1)'"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            });
            body.innerHTML = html;
            
            subtotalEl.setAttribute('data-usd', totalUsd);
            updateAllPrices();
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            renderCart();
        }

        // --- MODALES Y CALENDARIO (ESCASEZ AUTOMÁTICA) ---
        function openModal(id) { document.getElementById(id).classList.add('active'); }
        function closeModal(id) { document.getElementById(id).classList.remove('active'); }

        let selectedDayElement = null;
        let displayedDate = new Date();

        function openCalendarModal() {
            displayedDate = new Date(); 
            generateCalendar();
            openModal('calendarModalOverlay');
            document.getElementById('btnContinuarReserva').disabled = true;
            document.getElementById('btnContinuarReserva').classList.add('btn-disabled');
        }

        document.getElementById('prevMonth').addEventListener('click', () => {
            let today = new Date();
            if (displayedDate.getFullYear() > today.getFullYear() || 
               (displayedDate.getFullYear() === today.getFullYear() && displayedDate.getMonth() > today.getMonth())) {
                displayedDate.setMonth(displayedDate.getMonth() - 1);
                generateCalendar();
            }
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            let today = new Date();
            let daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            let daysLeft = daysInCurrentMonth - today.getDate();
            
            if (daysLeft <= 5) {
                if (displayedDate.getFullYear() === today.getFullYear() && displayedDate.getMonth() === today.getMonth()) {
                    displayedDate.setMonth(displayedDate.getMonth() + 1);
                    generateCalendar();
                }
            } else {
                alert('El próximo mes es solo una vista previa y se habilitará cuando falten 5 días para terminar el mes actual.');
            }
        });

        function generateCalendar() {
            const grid = document.getElementById('calendarDays');
            const monthDisplay = document.getElementById('monthYearDisplay');
            const prevBtn = document.getElementById('prevMonth');
            const nextBtn = document.getElementById('nextMonth');
            grid.innerHTML = '';
            
            const year = displayedDate.getFullYear();
            const month = displayedDate.getMonth();
            
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            monthDisplay.innerText = `${monthNames[month]} ${year}`;

            let today = new Date();
            today.setHours(0,0,0,0);

            if (year === today.getFullYear() && month === today.getMonth()) {
                prevBtn.style.opacity = '0.3'; prevBtn.style.cursor = 'not-allowed';
            } else {
                prevBtn.style.opacity = '1'; prevBtn.style.cursor = 'pointer';
            }

            let daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            let daysLeft = daysInCurrentMonth - today.getDate();
            if (daysLeft > 5 || (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth()))) {
                nextBtn.style.opacity = '0.3'; nextBtn.style.cursor = 'not-allowed';
            } else {
                nextBtn.style.opacity = '1'; nextBtn.style.cursor = 'pointer';
            }
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayIndex = new Date(year, month, 1).getDay();
            const startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

            for(let i=0; i < startDayOffset; i++) {
                grid.innerHTML += `<div class="calendar-day empty"></div>`;
            }

            for(let i=1; i <= daysInMonth; i++) {
                let currentIterDate = new Date(year, month, i);
                currentIterDate.setHours(0,0,0,0);
                
                let diffTime = currentIterDate.getTime() - today.getTime();
                let diffDays = Math.round(diffTime / (1000 * 3600 * 24));
                
                if (diffDays >= 0 && diffDays <= 4 && month === today.getMonth() && year === today.getFullYear()) {
                    let cupos = Math.floor(Math.random() * 3) + 1; 
                    let word = cupos === 1 ? 'cupo' : 'cupos';
                    grid.innerHTML += `<div class="calendar-day available" onclick="selectDate(this, ${i}, '${monthNames[month]}', ${year})">${i}<span class="cupos-badge">${cupos} ${word}</span></div>`;
                } else {
                    grid.innerHTML += `<div class="calendar-day disabled">${i}<span class="cupos-badge" style="background:#f0f0f0; color:#888; padding: 2px; border-radius: 4px; font-size: 0.6rem; margin-top: 5px; display:inline-block; width: 90%;">Agotado</span></div>`;
                }
            }
        }

        function selectDate(element, day, monthName, year) {
            if(selectedDayElement) {
                selectedDayElement.classList.remove('selected');
            }
            element.classList.add('selected');
            selectedDayElement = element;
            
            currentProduct.selectedDate = `${day} de ${monthName} ${year}`;
            document.getElementById('selectedDateDisplay').innerHTML = `<i class="far fa-calendar"></i> ${currentProduct.selectedDate}`;
            
            const btn = document.getElementById('btnContinuarReserva');
            btn.disabled = false;
            btn.classList.remove('btn-disabled');
        }


        // --- VALIDACIÓN DE FORMULARIO Y RESERVA FINAL ---
        const bookingForm = document.getElementById('bookingForm');
        const btnConfirmar = document.getElementById('btnConfirmarReserva');
        const emailInput = document.getElementById('bookingEmail');
        const emailConfirmInput = document.getElementById('bookingEmailConfirm');
        const nameInput = document.getElementById('bookingName');
        const phoneInput = document.getElementById('bookingPhone');

        [nameInput, emailInput, emailConfirmInput, phoneInput].forEach(input => {
            input.addEventListener('input', checkFormValidity);
        });

        function checkFormValidity() {
            let isValid = bookingForm.checkValidity();

            if (emailInput.value !== emailConfirmInput.value && emailConfirmInput.value !== '') {
                emailConfirmInput.setCustomValidity("Los correos electrónicos no coinciden.");
                isValid = false;
            } else {
                emailConfirmInput.setCustomValidity("");
            }

            if (isValid) {
                btnConfirmar.disabled = false;
                btnConfirmar.classList.remove('btn-disabled');
            } else {
                btnConfirmar.disabled = true;
                btnConfirmar.classList.add('btn-disabled');
            }
        }

        function handleBookingConfirm(e) {
            e.preventDefault();

            if (!bookingForm.checkValidity()) {
                bookingForm.reportValidity();
                return;
            }

            cart.push({...currentProduct});
            closeModal('formModalOverlay');
            bookingForm.reset();
            toggleCart();

            const paypalLink = "https://www.paypal.com/paypalme/tuusuario";
            
            alert('¡Reserva confirmada! Redirigiendo a PayPal para completar el pago...');
            window.open(paypalLink, '_blank');
        }

        // --- ANIMACIONES ON SCROLL (Lazy Fade-in) ---
        const faders = document.querySelectorAll('.product-card, .service-card, .about-block, .contact-form-container');
        
        const appearOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };

        const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                appearOnScroll.unobserve(entry.target);
            });
        }, appearOptions);

        faders.forEach(fader => {
            fader.style.opacity = '0';
            fader.style.transform = 'translateY(20px)';
            fader.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            appearOnScroll.observe(fader);
        });