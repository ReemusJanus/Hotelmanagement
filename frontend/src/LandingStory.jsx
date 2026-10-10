import ServiceTheatre from './ServiceTheatre';
import LandingMotion from './LandingMotion';
import { TeamStory, WorkspaceExplorer, BusinessStory, MobileStory, GettingStarted } from './LandingWorkspace';
import { useEffect, useRef, useState, useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowDown, Armchair, ChefHat, ReceiptText, Package, Check, Layers, Users, TrendingUp, Boxes, CheckCircle2 } from 'lucide-react';
import './landing-story.css';

function AnimatedQuestion({ question, answer, index }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const reduced = useReducedMotion();
  return <motion.div className={`story-faq-item${open ? ' is-open' : ''}`}
    initial={reduced ? false : { opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }}
    transition={{ duration: .45, delay: reduced ? 0 : Math.min(index * .055, .25) }}>
    <h3><button id={`${id}-question`} aria-expanded={open} aria-controls={`${id}-answer`} onClick={() => setOpen(value => !value)}>
      {question}<span aria-hidden="true">+</span>
    </button></h3>
    <div className="story-faq-answer" id={`${id}-answer`} role="region" aria-labelledby={`${id}-question`} aria-hidden={!open} inert={!open}>
      <div><p>{answer}</p></div>
    </div>
  </motion.div>;
}

const chapters = [
  { label: 'The welcome', title: 'Every great service starts with a seat.', description: 'See which tables are available, occupied, reserved or being cleaned. Reserve a table for a future visit, or open an available table to begin service.', role: 'ADMIN · WAITER', icon: Armchair, note: 'A clear floor. A confident first impression.' },
  { label: 'The order', title: 'Take the order. Keep the conversation.', description: 'Choose dishes and drinks, build the cart and send it to the team. Another coffee? Add a new round without losing the story of the first.', role: 'WAITER', icon: ReceiptText, note: 'Every item. Every additional round.' },
  { label: 'The rhythm', title: 'Different stations. One shared rhythm.', description: 'Food goes to the kitchen. Drinks go to the juice station. Follow preparation and readiness, then let Chef confirm collection and Waiter confirm receipt at the table.', role: 'CHEF · JUICER · WAITER', icon: ChefHat, note: 'From preparing to ready, collected to received.' },
  { label: 'The close', title: 'A graceful finish. A clearer business.', description: 'The waiter requests the bill. Admin records payment and completes the order. The table moves to cleaning, while sales become part of your financial overview.', role: 'WAITER · ADMIN', icon: CheckCircle2, note: 'Close the bill. Prepare for the next welcome.' },
];

function ServicePreview({ chapter, compact = false }) {
  return <div className={`story-console ${compact ? 'story-console-compact' : ''}`}>
    <div className="story-console-top"><span><i /> KnockOUT <b>/ service workspace</b></span><span className="story-demo">Illustrative preview</span></div>
    <div className="story-console-body">
      <aside aria-hidden="true"><img className="story-console-monogram" src="/knockout-logo.png" alt=""/>{[Armchair, ReceiptText, ChefHat, CheckCircle2].map((Icon, i) => <span className={chapter === i ? 'selected' : ''} key={i}><Icon size={18}/></span>)}</aside>
      <div className="story-console-content" key={chapter}>
        <div className="story-preview-heading"><div><small>{chapters[chapter].role}</small><h3>{['Your floor, at a glance', 'A new round of possibilities', 'Good service is a team sport', 'Service, beautifully completed'][chapter]}</h3></div><span className="story-status">{['Floor overview', 'New order', 'In preparation', 'Completed'][chapter]}</span></div>
        {chapter === 0 && <><div className="story-preview-summary"><span><strong>08</strong> tables</span><span><strong>03</strong> available</span><span><strong>02</strong> reserved</span></div><div className="story-floor">{['Occupied', 'Available', 'Reserved', 'Occupied', 'Available', 'Cleaning', 'Available', 'Reserved'].map((state, i) => <div className={`story-table ${state.toLowerCase()}`} key={i}><Armchair size={22}/><strong>Table {String(i + 1).padStart(2, '0')}</strong><small>{state}</small></div>)}</div></>}
        {chapter === 1 && <div className="story-order"><div className="story-order-caption"><span>Table 02</span><span>Round 01</span></div>{[['Grilled chicken', 'Kitchen', '2'], ['Fresh lime juice', 'Juice station', '2'], ['Garden salad', 'Kitchen', '1']].map(([name,station,qty]) => <div className="story-order-line" key={name}><span className="story-food-icon">{station === 'Kitchen' ? <ChefHat/> : <Layers/>}</span><span><strong>{name}</strong><small>{station}</small></span><b>× {qty}</b></div>)}<div className="story-preview-message"><Check size={16}/> One order. Routed to the right stations.</div></div>}
        {chapter === 2 && <><div className="story-kitchen">{[['Kitchen', 'Grilled chicken · Garden salad', 'Preparing'], ['Juice station', 'Fresh lime juice', 'Ready']].map(([station,items,status]) => <div key={station}><ChefHat size={22}/><h4>{station}</h4><p>{items}</p><span className={`story-ticket-status ${status.toLowerCase()}`}>{status}</span></div>)}</div><div className="story-handoff"><span>Prepare</span><i/><span>Collect</span><i/><span>Receive</span></div></>}
        {chapter === 3 && <div className="story-complete"><span className="story-complete-icon"><Check size={34}/></span><h4>One service. All connected.</h4><p>Payment recorded. Table ready for cleaning.</p><div><span><ReceiptText size={17}/> Bill completed</span><span><Armchair size={17}/> Cleaning</span></div></div>}
      </div>
    </div>
    <div className="story-console-bottom"><span>TABLES → ORDERS → KITCHEN → BILLING</span><span>0{chapter + 1} / 04</span></div>
  </div>;
}

export default function LandingStory({ login, register }) {
  const [chapter, setChapter] = useState(0);
  const root = useRef(null);
  useEffect(() => {
    const nodes = root.current.querySelectorAll('[data-chapter]');
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setChapter(Number(visible[0].target.dataset.chapter));
    }, { rootMargin: '-20% 0px -35% 0px', threshold: [0, .3, .6] });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  function selectChapter(index) {
    setChapter(index);
    document.getElementById(`service-chapter-${index}`).scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  }
  return <main className="story-site" ref={root}>
    <LandingMotion root={root}/>
    <a className="story-skip" href="#story-main">Skip to content</a>
    <nav className="story-nav" aria-label="Main navigation"><a href="#story-main" className="story-brand"><img className="story-brand-logo" src="/knockout-logo.png" alt=""/><b>KnockOUT<small>THE HOSPITALITY WORKSPACE</small></b></a><div className="story-nav-links"><a href="#service-story">The story</a><a href="#workspace-explorer">The workspace</a><a href="#your-team">Your team</a><a href="#story-questions">Questions</a></div><div className="story-nav-actions"><button className="story-login" onClick={login}>Sign in</button><button className="story-button" onClick={register}>Get started <ArrowRight size={15}/></button></div></nav>
    <section className="story-hero" id="story-main">
      <div className="story-hero-copy"><span className="story-eyebrow"><i/> LESS FRICTION. MORE HOSPITALITY.</span><h1>A hundred little moments.<br/><em>One beautiful service.</em></h1><p>The first welcome. The next order. The final bill.<br className="story-desktop-break"/> Bring your floor, kitchen and business together with KnockOUT.</p><div className="story-hero-actions"><button className="story-button" onClick={register}>Start your story <ArrowRight size={17}/></button><a href="#service-story" className="story-text-link">See how it works <ArrowDown size={16}/></a></div><div className="story-hero-tags"><span>Restaurants</span><i/><span>Cafés</span><i/><span>Takeaway teams</span></div></div>
      <div className="story-hero-stage"><div className="story-depth-orbits" aria-hidden="true"><i/><i/><i/>{Array.from({length:8},(_,i)=><span key={i} style={{"--particle":i}}/>)}</div><div className="story-halo"/><div className="story-hero-console"><ServicePreview chapter={0} compact/></div><div className="story-float story-float-a"><ChefHat size={22}/><span><b>The kitchen has the order.</b><small>The floor stays in the flow.</small></span></div><div className="story-float story-float-b"><CheckCircle2 size={22}/><span><b>Every handoff matters.</b><small>Keep the whole team connected.</small></span></div><span className="story-stage-caption">A WORKSPACE BUILT AROUND THE WAY YOU SERVE</span></div>
      <a className="story-scroll" href="#service-story"><span>SCROLL TO FOLLOW ONE SERVICE</span><ArrowDown size={16}/></a>
    </section>
    <ServiceTheatre/>
    <section className="story-intro"><span className="story-eyebrow">NOT JUST ANOTHER DASHBOARD</span><h2>Behind every effortless experience,<br/><em>there’s a team in sync.</em></h2><p>Let’s follow a table through your restaurant.<br/>Four moments. One connected workspace.</p></section>
    <section className="story-journey" id="service-story" aria-label="The story of one service">
      <div className="story-chapters">{chapters.map((item,index) => <article className={chapter === index ? 'story-chapter active' : 'story-chapter'} data-chapter={index} id={`service-chapter-${index}`} key={item.label}><span className="story-chapter-number">0{index+1}<small>/ 04 — {item.label}</small></span><item.icon size={28}/><h2>{item.title}</h2><p>{item.description}</p><div className="story-chapter-note"><span/>{item.note}</div><div className="story-mobile-preview"><ServicePreview chapter={index}/></div></article>)}</div>
      <div className="story-sticky"><div className="story-sticky-preview"><ServicePreview chapter={chapter}/></div><div className="story-chapter-controls" aria-label="Select a story chapter">{chapters.map((item,index) => <button key={item.label} onClick={() => selectChapter(index)} aria-current={chapter === index ? 'step' : undefined} aria-label={`Chapter ${index+1}: ${item.label}`}><span>0{index+1}</span>{item.label}</button>)}</div><p className="story-preview-disclaimer">Example screens explain the workflow; they are not live business data.</p></div>
    </section>
    <TeamStory/>
    <section className="story-beyond" id="beyond-service"><div className="story-section-heading"><span className="story-eyebrow">AND THE STORY DOESN’T END AT THE TABLE</span><h2>The whole business.<br/><em>In the picture.</em></h2><p>From the next takeaway order to tomorrow’s stock.<br/>Give every part of your operation a place to work.</p></div><div className="story-feature-grid">{[
      [Package,'Service beyond the floor','Create parcel orders, follow preparation, record payment and manage collection.','TAKEAWAY'],
      [Boxes,'Know what’s on the shelf','Track inventory movements, review low stock and manage kitchen stock requests.','STOCK & MENU'],
      [TrendingUp,'Close the day with clarity','Review daily bills, record expenses and supplier payments, and export financial reports.','FINANCE'],
      [Users,'A workspace for every role','Dedicated Admin, Waiter, Chef and Juicer views. Staff can record their shifts in the mobile app.','YOUR TEAM'],
    ].map(([Icon,title,copy,label],index) => <article key={title}><div className="story-feature-icon"><Icon size={26}/></div><span className="story-feature-index">0{index+1}</span><small>{label}</small><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <BusinessStory/>
    <WorkspaceExplorer/>
    <MobileStory/>
    <section className="story-network"><div className="story-network-art" aria-hidden="true"><div className="story-network-core"><img src="/knockout-logo.png" alt=""/></div>{['Your restaurant','Your café','Your next location'].map((label,i) => <span className={`story-location story-location-${i}`} key={label}><Armchair size={20}/>{label}<small>Its own workspace</small></span>)}</div><div><span className="story-eyebrow">YOUR NEXT CHAPTER</span><h2>Room for your business<br/><em>to become more.</em></h2><p>Keep each company’s operations in its own workspace. Company administration brings access, enabled modules and subscriptions together, while each team focuses on its own service.</p><button className="story-text-link" onClick={register}>Register your business <ArrowRight size={17}/></button></div></section>
    <GettingStarted register={register}/>
    <section className="story-faq" id="story-questions"><div className="story-faq-heading"><span className="story-eyebrow">BEFORE WE BEGIN</span><h2>A little clarity.</h2><div className="story-clarity-art" aria-hidden="true"><div className="story-clarity-halo"/><div className="story-clarity-orbit"/><div className="story-clarity-orbit second"/><div className="story-clarity-cube"><span>?</span></div><span className="story-clarity-spark spark-one"/><span className="story-clarity-spark spark-two"/><span className="story-clarity-spark spark-three"/></div><p className="story-faq-hint">A few answers.<br/>A clearer picture.</p></div><div>{[
      ['What does KnockOUT manage?','Restaurant tables and table bookings, dine-in and parcel orders, food and juice preparation, billing, menu, inventory, finance and staff operations.'],
      ['Is this a hotel room booking system?','The current product focuses on food-service operations. Bookings reserve restaurant tables; room reservations, guest stays and hotel check-in are not part of the current workflow.'],
      ['Can my team use it on mobile?','Yes. There is a web workspace and a mobile app with role-specific views. Some tools differ between platforms; staff attendance is available in the mobile app.'],
      ['Can I manage takeaway orders too?','Yes. Admin can create parcel orders, track food and drink preparation, record payment and manage collection separately from dine-in service.'],
      ['Does stock reduce automatically when a dish is sold?','Inventory is based on recorded movements such as purchases, usage, waste and adjustments. The current product does not provide automatic recipe-based stock deduction.'],
      ['Can I record supplier payments and export reports?','Yes. Record supplier purchases and payments, review outstanding balances, and export daily finance or monthly revenue CSV reports from the web workspace.'],
      ['How do I get started?','Register your business and select a package. Your application is reviewed before you complete setup and receive your company login details.'],
     ].map(([question,answer], index) => <AnimatedQuestion key={question} question={question} answer={answer} index={index}/>)}</div></section>
    <section className="story-finale"><span className="story-eyebrow">GREAT SERVICE STARTS WITH A CONNECTED TEAM</span><h2>Your people. Your place.<br/><em>Your next chapter.</em></h2><p>Give the everyday work of hospitality a little more flow.</p><button className="story-button" onClick={register}>Let’s begin <ArrowRight size={18}/></button><a href="#service-story" className="story-finale-link">Take another look at the story</a><span className="story-finale-mark" aria-hidden="true"><img src="/knockout-logo.png" alt=""/></span></section>
    <footer className="story-footer"><a className="story-brand" href="#story-main"><img className="story-brand-logo" src="/knockout-logo.png" alt=""/><b>KnockOUT<small>HOSPITALITY, CONNECTED.</small></b></a><span>Built for the people behind every service.</span><small>© {new Date().getFullYear()} KnockOUT</small></footer>
  </main>;
}
