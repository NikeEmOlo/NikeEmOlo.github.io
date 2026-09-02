//----------------------- STATE -----------------------//
let isAnimating = false
export let currentCategory = null

//----------------------- CARD FILTER & TAB SWITCHING -----------------------//
export function applyFilter(category) {
    currentCategory = category
    const allCards = [...document.querySelectorAll('.cards-row li[data-category]')]
    const cardsRow = document.querySelector('.cards-row')
    const visibleCards = allCards.filter(c => c.dataset.category === category)
    allCards.forEach(c => c.classList.toggle('hidden', c.dataset.category !== category))
    cardsRow?.style.setProperty('--card-count', visibleCards.length)
    visibleCards.forEach((c, i) => c.style.setProperty('--index', i))
}

function animateTabSwitch(category) {
    const allCards = [...document.querySelectorAll('.cards-row li[data-category]')]
    const cardsRow = document.querySelector('.cards-row')
    const navButtons = [...document.querySelectorAll('#project-list button')]
    const tabAnnouncement = document.getElementById('tab-announcement')

    const currentlyVisible = allCards.filter(c => !c.classList.contains('hidden'))
    const incomingCount = allCards.filter(c => c.dataset.category === category).length

    isAnimating = true
    navButtons.forEach(b => b.disabled = true)

    cardsRow?.classList.add('is-animating')
    currentlyVisible.forEach(c => c.classList.add('at-center'))

    setTimeout(() => {
        applyFilter(category)
        allCards.forEach(c => {
            if (c.dataset.category !== category) c.classList.remove('at-center')
        })

        if (tabAnnouncement) {
            tabAnnouncement.textContent = ''
            requestAnimationFrame(() => {
                tabAnnouncement.textContent = `Showing ${incomingCount} ${category} project${incomingCount === 1 ? '' : 's'}`
            })
        }

        setTimeout(() => {
            cardsRow?.classList.remove('is-animating')
            isAnimating = false
            navButtons.forEach(b => {
                b.disabled = b.getAttribute('aria-pressed') === 'true'
            })
        }, 1000)
    }, 600)
}

function initCardFilter() {
    const navButtons = [...document.querySelectorAll('#project-list button')]
    const allCards = [...document.querySelectorAll('.cards-row li[data-category]')]

    navButtons.forEach(button => {
        button.onclick = () => {
            if (isAnimating) return
            navButtons.forEach(b => {
                const isActive = b === button
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false')
                b.disabled = isActive
            })
            if (button.dataset.category) animateTabSwitch(button.dataset.category)
        }
    })

    const firstCategoryButton = navButtons.find(b => b.dataset.category)
    if (firstCategoryButton && !currentCategory) {
        firstCategoryButton.setAttribute('aria-pressed', 'true')
        allCards.forEach(c => { c.style.transition = 'none' })
        applyFilter(firstCategoryButton.dataset.category)
        requestAnimationFrame(() => allCards.forEach(c => { c.style.transition = '' }))
    }
}

//----------------------- HAMBURGER MENU -----------------------//
function closeMenu() {
    const hamburger = document.querySelector('.hamburger')
    hamburger?.setAttribute('aria-expanded', 'false')
    hamburger?.setAttribute('aria-label', 'Open menu')
}

//----------------------- CONTACT HANGING CHAIN CONTROLLERS -----------------------//
export function openContactChain(contactLi, contactBtn) {
    if (!contactLi || !contactBtn) return
    const contactAnchor = document.getElementById('contactHangingChain')
    const outerOfficeLi = document.querySelector('.nav-outer-office-li')
    contactLi.classList.remove('is-contact-closing')
    contactLi.classList.add('is-contact-open')
    outerOfficeLi?.classList.add('is-compact-sign')
    contactBtn.setAttribute('aria-expanded', 'true')
    contactAnchor?.setAttribute('aria-hidden', 'false')
}

export function closeContactChain(contactLi, contactBtn) {
    if (!contactLi || !contactBtn) return
    const contactAnchor = document.getElementById('contactHangingChain')
    const outerOfficeLi = document.querySelector('.nav-outer-office-li')
    if (!contactLi.classList.contains('is-contact-open')) return

    contactLi.classList.remove('is-contact-open')
    contactLi.classList.add('is-contact-closing')
    outerOfficeLi?.classList.remove('is-compact-sign')
    contactBtn.setAttribute('aria-expanded', 'false')

    setTimeout(() => {
        contactLi.classList.remove('is-contact-closing')
        contactAnchor?.setAttribute('aria-hidden', 'true')
    }, 350)
}

function handleCopyEmail(copyBtn) {
    const email = 'nike.emily@pm.me'
    navigator.clipboard?.writeText(email).then(() => {
        const copyText = copyBtn.querySelector('.copy-btn-text')
        if (copyText) {
            const prevText = copyText.textContent
            copyText.textContent = 'Copied! ✓'
            copyBtn.classList.add('is-copied')
            setTimeout(() => {
                copyText.textContent = prevText
                copyBtn.classList.remove('is-copied')
            }, 2000)
        }
    }).catch(() => {
        const copyText = copyBtn.querySelector('.copy-btn-text')
        if (copyText) {
            copyText.textContent = 'nike.emily@pm.me'
        }
    })
}

function setupCopyHover() {
    const contactLi = document.querySelector('.nav-contact-li')
    const nodeEmail = contactLi?.querySelector('.node-email')
    const copyBtn = document.getElementById('copyEmailQuickBtn')
    if (!nodeEmail || !copyBtn) return

    let copyGraceTimer = null

    function showCopyBtn() {
        if (copyGraceTimer) {
            clearTimeout(copyGraceTimer)
            copyGraceTimer = null
        }
        copyBtn.classList.add('is-active')
    }

    function hideCopyBtn() {
        if (copyGraceTimer) clearTimeout(copyGraceTimer)
        copyGraceTimer = setTimeout(() => {
            copyBtn.classList.remove('is-active')
        }, 700)
    }

    nodeEmail.onmouseenter = showCopyBtn
    nodeEmail.onmouseleave = hideCopyBtn
    copyBtn.onmouseenter = showCopyBtn
    copyBtn.onmouseleave = hideCopyBtn
}

//----------------------- OUTER OFFICE UNDER-CONSTRUCTION SIGN -----------------------//
let outerRetractTimer = null
let outerClosingTimer = null

export function openOuterOfficeSign(outerOfficeLi, outerOfficeBtn) {
    if (!outerOfficeLi || !outerOfficeBtn) return
    const signAnchor = document.getElementById('outerOfficeSign')
    if (outerRetractTimer) clearTimeout(outerRetractTimer)
    if (outerClosingTimer) clearTimeout(outerClosingTimer)
    outerOfficeLi.classList.remove('is-sign-closing')
    outerOfficeLi.classList.add('is-sign-open')
    outerOfficeBtn.setAttribute('aria-expanded', 'true')
    signAnchor?.setAttribute('aria-hidden', 'false')
}

export function closeOuterOfficeSign(outerOfficeLi, outerOfficeBtn, immediate = false) {
    if (!outerOfficeLi || !outerOfficeBtn) return
    const signAnchor = document.getElementById('outerOfficeSign')
    if (outerRetractTimer) clearTimeout(outerRetractTimer)
    if (outerClosingTimer) clearTimeout(outerClosingTimer)

    if (immediate) {
        outerOfficeLi.classList.remove('is-sign-open', 'is-sign-closing', 'is-sign-shake')
        outerOfficeBtn.setAttribute('aria-expanded', 'false')
        signAnchor?.setAttribute('aria-hidden', 'true')
        return
    }

    outerOfficeLi.classList.remove('is-sign-open')
    outerOfficeLi.classList.add('is-sign-closing')
    outerClosingTimer = setTimeout(() => {
        outerOfficeLi.classList.remove('is-sign-closing', 'is-sign-shake')
        outerOfficeBtn.setAttribute('aria-expanded', 'false')
        signAnchor?.setAttribute('aria-hidden', 'true')
        outerClosingTimer = null
    }, 360)
}

function scheduleOuterRetract(outerOfficeLi, outerOfficeBtn, delayMs = 2000) {
    if (outerRetractTimer) clearTimeout(outerRetractTimer)
    outerRetractTimer = setTimeout(() => {
        closeOuterOfficeSign(outerOfficeLi, outerOfficeBtn, false)
    }, delayMs)
}

function setupOuterOfficeHover() {
    const outerOfficeLi = document.querySelector('.nav-outer-office-li')
    const outerOfficeBtn = document.getElementById('navOuterOfficeBtn')
    if (!outerOfficeLi || !outerOfficeBtn) return

    outerOfficeLi.onmouseenter = () => openOuterOfficeSign(outerOfficeLi, outerOfficeBtn)
    outerOfficeLi.onmouseleave = () => {
        if (outerOfficeLi.classList.contains('is-sign-open')) {
            scheduleOuterRetract(outerOfficeLi, outerOfficeBtn, 2000)
        }
    }
    outerOfficeBtn.onfocus = () => openOuterOfficeSign(outerOfficeLi, outerOfficeBtn)
    outerOfficeBtn.onblur = () => scheduleOuterRetract(outerOfficeLi, outerOfficeBtn, 1000)
    outerOfficeBtn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!outerOfficeLi.classList.contains('is-sign-open')) {
            openOuterOfficeSign(outerOfficeLi, outerOfficeBtn)
            scheduleOuterRetract(outerOfficeLi, outerOfficeBtn, 2000)
        } else {
            outerOfficeLi.classList.remove('is-sign-shake')
            void outerOfficeLi.offsetWidth
            outerOfficeLi.classList.add('is-sign-shake')
            scheduleOuterRetract(outerOfficeLi, outerOfficeBtn, 2000)
        }
    }
}

//----------------------- NAV RESIZE (MOBILE ADAPTATION) -----------------------//
function updateNavMode() {
    const nav = document.querySelector('nav')
    if (!nav) return
    const wasMobile = nav.classList.contains('is-mobile')
    nav.classList.remove('is-mobile')
    nav.style.width = 'max-content'
    const naturalWidth = nav.offsetWidth
    nav.style.width = ''

    const rightOffset = parseFloat(getComputedStyle(nav).right) || 0
    if (naturalWidth + rightOffset >= window.innerWidth) {
        nav.classList.add('is-mobile')
    } else if (wasMobile) {
        closeMenu()
    }
}

//----------------------- GLOBAL EVENT DELEGATION -----------------------//
document.addEventListener('click', (e) => {
    const target = e.target
    if (!(target instanceof Element)) return

    // 1. Hamburger button toggle
    const hamburgerBtn = target.closest('.hamburger')
    if (hamburgerBtn) {
        const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true'
        hamburgerBtn.setAttribute('aria-expanded', String(!isExpanded))
        hamburgerBtn.setAttribute('aria-label', isExpanded ? 'Open menu' : 'Close menu')
        return
    }

    // 2. Contact button click (open/close toggle)
    const contactBtn = target.closest('#navContactBtn')
    if (contactBtn) {
        e.preventDefault()
        e.stopPropagation()
        const contactLi = contactBtn.closest('.nav-contact-li')
        if (contactLi) {
            if (contactLi.classList.contains('is-contact-open')) {
                closeContactChain(contactLi, contactBtn)
            } else {
                openContactChain(contactLi, contactBtn)
            }
        }
        return
    }

    // 3. Quick Copy Email button click
    const copyBtn = target.closest('#copyEmailQuickBtn')
    if (copyBtn) {
        e.preventDefault()
        e.stopPropagation()
        handleCopyEmail(copyBtn)
        return
    }

    // 4. Click outside Contact chain -> close it
    if (!target.closest('.nav-contact-li')) {
        const openContactLi = document.querySelector('.nav-contact-li.is-contact-open')
        const openContactBtn = document.getElementById('navContactBtn')
        if (openContactLi && openContactBtn) {
            closeContactChain(openContactLi, openContactBtn)
        }
    }

    // 5. Click outside Outer Office -> close it
    if (!target.closest('.nav-outer-office-li')) {
        const openOuterLi = document.querySelector('.nav-outer-office-li.is-sign-open')
        const openOuterBtn = document.getElementById('navOuterOfficeBtn')
        if (openOuterLi && openOuterBtn) {
            closeOuterOfficeSign(openOuterLi, openOuterBtn, false)
        }
    }

    // 6. Click on other nav items -> close mobile hamburger menu
    if (target.closest('#pages-list button:not(#navOuterOfficeBtn):not(#navContactBtn):not(#copyEmailQuickBtn), #pages-list a')) {
        closeMenu()
    }

    // 7. Click outside nav -> close mobile menu
    if (!target.closest('nav')) {
        closeMenu()
    }
})

// Escape key dismisses open menus
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openContactLi = document.querySelector('.nav-contact-li.is-contact-open')
        const openContactBtn = document.getElementById('navContactBtn')
        if (openContactLi && openContactBtn) {
            closeContactChain(openContactLi, openContactBtn)
            openContactBtn.focus()
        }
    }
})

//----------------------- LIFECYCLE MOUNT -----------------------//
function initAllNavigation() {
    initCardFilter()
    setupCopyHover()
    setupOuterOfficeHover()
    updateNavMode()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllNavigation)
} else {
    initAllNavigation()
}

document.addEventListener('astro:page-load', initAllNavigation)

if (typeof ResizeObserver !== 'undefined' && document.documentElement) {
    new ResizeObserver(updateNavMode).observe(document.documentElement)
}

