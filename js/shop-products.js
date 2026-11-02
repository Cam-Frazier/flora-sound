/* Public WooCommerce Store API — no API keys required. */
(() => {
    const track = document.getElementById('shop-products');
    const prev = document.getElementById('shop-products-prev');
    const next = document.getElementById('shop-products-next');

    if (!track || !prev || !next) return;

    const shopOrigin = 'https://shop.florasound.com';
    const endpoint = shopOrigin + '/wp-json/wc/store/v1/products?per_page=12&orderby=date&order=desc';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function safeShopLink(value) {
        try {
            const url = new URL(value, shopOrigin);
            return url.origin === shopOrigin && url.protocol === 'https:' ? url.href : shopOrigin;
        } catch {
            return shopOrigin;
        }
    }

    function currencyText(prices) {
        if (!prices || prices.price == null) return '';
        const minorUnit = Number(prices.currency_minor_unit ?? 2);
        const amount = Number(prices.price) / Math.pow(10, minorUnit);
        if (!Number.isFinite(amount)) return '';
        const currency = prices.currency_code || 'CAD';
        try {
            return new Intl.NumberFormat('en-CA', {
                style: 'currency',
                currency
            }).format(amount);
        } catch {
            return prices.currency_prefix + amount.toFixed(minorUnit) + (prices.currency_suffix || '');
        }
    }

    function createCard(product) {
        const card = document.createElement('article');
        card.className = 'shop-product-card';

        const link = document.createElement('a');
        link.href = safeShopLink(product.permalink);
        link.setAttribute('aria-label', 'View ' + (product.name || 'product') + ' in the shop');

        const imageWrap = document.createElement('div');
        imageWrap.className = 'shop-product-image';

        const photo = product.images?.find(image => image.src);
        if (photo) {
            const img = document.createElement('img');
            img.src = photo.thumbnail || photo.src;
            img.alt = photo.alt || product.name || 'Flora merchandise';
            img.loading = 'lazy';
            img.decoding = 'async';
            imageWrap.appendChild(img);
        }

        const copy = document.createElement('div');
        copy.className = 'shop-product-copy';

        const name = document.createElement('h3');
        name.className = 'shop-product-title';
        name.textContent = product.name || 'Flora merchandise';
        copy.appendChild(name);

        const price = currencyText(product.prices);
        if (price) {
            const priceNode = document.createElement('span');
            priceNode.className = 'shop-product-price';
            priceNode.textContent = price;
            copy.appendChild(priceNode);
        }

        link.append(imageWrap, copy);
        card.appendChild(link);
        return card;
    }

    function showFallback() {
        stopAutoplay();
        productCount = 0;
        track.replaceChildren();
        const message = document.createElement('p');
        message.className = 'shop-feature-status';
        message.append('Explore the latest Flora merchandise directly in our ');
        const link = document.createElement('a');
        link.href = shopOrigin;
        link.textContent = 'online shop.';
        message.appendChild(link);
        track.appendChild(message);
        updateArrows();
    }


    const AUTOPLAY_DELAY = 4000;
    let productCount = 0;
    let currentIndex = 0;
    let autoplay = null;
    let scrollEndTimer = null;
    let hovering = false;
    let focusInside = false;

    function stepSize() {
        const card = track.querySelector('.shop-product-card');
        return card ? card.getBoundingClientRect().width +
            (parseFloat(getComputedStyle(track).gap) || 0) : 0;
    }

    // Three sets let the slider cross either end before quietly resetting
    // to the identical position in the middle set.
    function jumpTo(index) {
        const oldSnap = track.style.scrollSnapType;
        const oldBehavior = track.style.scrollBehavior;
        track.style.scrollSnapType = 'none';
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = index * stepSize();
        // Force the browser to apply the jump before restoring scroll snapping.
        void track.offsetWidth;
        track.style.scrollSnapType = oldSnap;
        track.style.scrollBehavior = oldBehavior;
    }

    function normalizePosition() {
        if (productCount < 2) return;
        const step = stepSize();
        if (!step) return;
        const absoluteIndex = Math.round(track.scrollLeft / step);
        if (absoluteIndex < productCount || absoluteIndex >= productCount * 2) {
            const normalized = ((absoluteIndex % productCount) + productCount) % productCount;
            jumpTo(productCount + normalized);
            currentIndex = normalized;
        } else {
            currentIndex = absoluteIndex - productCount;
        }
    }

    function updateArrows() {
        const enabled = productCount > 1;
        prev.disabled = !enabled;
        next.disabled = !enabled;
    }

    function move(direction) {
        if (productCount < 2) return;
        // Reset to the middle copy before moving if the user reached a clone.
        normalizePosition();
        currentIndex = (currentIndex + direction + productCount) % productCount;
        const absoluteIndex = Math.round(track.scrollLeft / stepSize()) + direction;
        track.scrollTo({
            left: absoluteIndex * stepSize(),
            behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });
    }

    function stopAutoplay() {
        if (autoplay !== null) {
            clearInterval(autoplay);
            autoplay = null;
        }
    }

    function startAutoplay() {
        stopAutoplay();
        if (productCount < 2 || reducedMotion.matches || document.hidden ||
            hovering || focusInside) return;
        autoplay = window.setInterval(() => move(1), AUTOPLAY_DELAY);
    }

    prev.addEventListener('click', () => { move(-1); startAutoplay(); });
    next.addEventListener('click', () => { move(1); startAutoplay(); });
    track.addEventListener('scroll', () => {
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(normalizePosition, 220);
    }, { passive: true });
    window.addEventListener('resize', () => {
        if (productCount > 1) jumpTo(productCount + currentIndex);
    });
    track.addEventListener('pointerenter', () => { hovering = true; stopAutoplay(); });
    track.addEventListener('pointerleave', () => { hovering = false; startAutoplay(); });
    track.addEventListener('focusin', () => { focusInside = true; stopAutoplay(); });
    track.addEventListener('focusout', event => {
        if (!track.contains(event.relatedTarget)) {
            focusInside = false;
            startAutoplay();
        }
    });
    document.addEventListener('visibilitychange', startAutoplay);
    reducedMotion.addEventListener?.('change', startAutoplay);

    async function loadProducts() {
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });
            if (!response.ok) throw new Error('Store API returned HTTP ' + response.status);

            const products = await response.json();
            if (!Array.isArray(products)) throw new Error('Invalid Store API response');

            const visible = products.filter(product =>
                product && product.permalink && product.is_in_stock !== false
            );
            if (!visible.length) return showFallback();

            productCount = visible.length;
            currentIndex = 0;
            const cards = visible.map(createCard);
            if (productCount > 1) {
                // Clones remain usable product links during the looping transition.
                const before = cards.map(card => card.cloneNode(true));
                const after = cards.map(card => card.cloneNode(true));
                track.replaceChildren(...before, ...cards, ...after);
                jumpTo(productCount);
            } else {
                track.replaceChildren(...cards);
            }
            updateArrows();
            startAutoplay();
        } catch (error) {
            console.warn('Flora merchandise feed unavailable:', error);
            showFallback();
        }
    }

    loadProducts();
})();
