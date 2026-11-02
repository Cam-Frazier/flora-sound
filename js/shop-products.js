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

    function updateArrows() {
        const maxScroll = track.scrollWidth - track.clientWidth;
        prev.disabled = track.scrollLeft < 5;
        next.disabled = maxScroll < 5 || track.scrollLeft >= maxScroll - 5;
    }

    function move(direction) {
        const card = track.querySelector('.shop-product-card');
        if (!card) return;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        track.scrollBy({
            left: direction * (card.getBoundingClientRect().width + gap),
            behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });
    }

    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

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

            track.replaceChildren(...visible.map(createCard));
            updateArrows();
        } catch (error) {
            console.warn('Flora merchandise feed unavailable:', error);
            showFallback();
        }
    }

    loadProducts();
})();
