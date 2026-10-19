const BOXES = 'nav ul, .segmented';

function place(box) {
    const slide = box.querySelector(':scope > .slide');
    const active = box.querySelector('.active');
    if (!slide) return;
    if (!active || !active.offsetWidth) { slide.style.opacity = '0'; return; }

    const measure = active.closest('li') || active;
    const g = parseFloat(getComputedStyle(box).getPropertyValue('--slide-grow')) || 0;

    slide.style.width = `${measure.offsetWidth + g * 2}px`;
    slide.style.height = `${measure.offsetHeight + g * 2}px`;
    slide.style.transform = `translate(${measure.offsetLeft - g}px, ${measure.offsetTop - g}px)`;
    slide.style.opacity = '1';
}

export function initSliders() {
    document.querySelectorAll(BOXES).forEach(box => {
        const slide = document.createElement('span');
        slide.className = 'slide';
        slide.setAttribute('aria-hidden', 'true');
        box.appendChild(slide);

        let queued = false;
        const update = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => { queued = false; place(box); });
        };
        new MutationObserver(update).observe(box, {
            subtree: true, childList: true, attributes: true, attributeFilter: ['class']
        });
        new ResizeObserver(update).observe(box);
        place(box);

        requestAnimationFrame(() => requestAnimationFrame(() => { box.dataset.slide = 'ready'; }));
    });
    if (document.fonts?.ready) document.fonts.ready.then(() => {
        document.querySelectorAll(BOXES).forEach(place);
    });
}
