const header=document.querySelector('[data-header]');
const navToggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.site-nav');
const modalTriggers=document.querySelectorAll('[data-open-modal]');
const modalClosers=document.querySelectorAll('[data-close-modal]');
const animatedItems=document.querySelectorAll('[data-animate]');
const parallaxItems=document.querySelectorAll('[data-parallax]');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let activeModal=null;
let lastFocused=null;
let ticking=false;

function updateHeader(){
  header?.classList.toggle('is-scrolled',window.scrollY>20);
}

function updateParallax(){
  if(reduceMotion) return;
  parallaxItems.forEach(item=>{
    const speed=parseFloat(item.dataset.parallax||'0.08');
    const rect=item.getBoundingClientRect();
    const offset=(rect.top-window.innerHeight/2)*speed;
    item.style.transform=`translate3d(0,${offset}px,0)`;
  });
}

function onScroll(){
  if(ticking) return;
  window.requestAnimationFrame(()=>{
    updateHeader();
    updateParallax();
    ticking=false;
  });
  ticking=true;
}

function closeNav(){
  nav?.classList.remove('is-open');
  navToggle?.setAttribute('aria-expanded','false');
}

function openModal(id){
  const modal=document.getElementById(id);
  if(!modal) return;
  lastFocused=document.activeElement;
  activeModal=modal;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  modal.querySelector('input,textarea,button')?.focus();
}

function closeModal(){
  if(!activeModal) return;
  activeModal.classList.remove('is-open');
  activeModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  lastFocused?.focus?.();
  activeModal=null;
}

if('IntersectionObserver' in window && !reduceMotion){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.16,rootMargin:'0px 0px -60px 0px'});
  animatedItems.forEach(item=>observer.observe(item));
}else{
  animatedItems.forEach(item=>item.classList.add('is-visible'));
}

updateHeader();
updateParallax();
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll,{passive:true});

navToggle?.addEventListener('click',event=>{
  event.stopPropagation();

  const isOpen=nav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded',isOpen?'true':'false');
});

document.addEventListener('click',event=>{
  if(!nav?.classList.contains('is-open')) return;

  const clickedInsideNav=nav.contains(event.target);
  const clickedToggle=navToggle?.contains(event.target);

  if(!clickedInsideNav && !clickedToggle){
    closeNav();
  }
});

nav?.querySelectorAll('a').forEach(link=>{
  link.addEventListener('click',()=>{
    closeNav();
  });
});

modalTriggers.forEach(trigger=>{
  trigger.addEventListener('click',()=>openModal(trigger.dataset.openModal));
});

modalClosers.forEach(closer=>{
  closer.addEventListener('click',closeModal);
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    closeModal();
    closeNav();
  }
});
