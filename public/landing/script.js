document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Navigation Drawer
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileDrawer = document.getElementById("mobileDrawer");

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = mobileDrawer.classList.toggle("open");
      mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    mobileDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileDrawer.classList.remove("open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 2. Interactive 3-Tap Citizen Flow (Keeps captura-modelo.png as sole image)
  const flowSteps = document.querySelectorAll(".flow-step");

  function setFlowStep(index) {
    flowSteps.forEach((btn, idx) => {
      const active = idx === index;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  flowSteps.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.step || 0);
      setFlowStep(idx);
    });
  });

  setFlowStep(0);

  // 3. Interactive Manager Dashboard (Map <-> List Sync)
  const clusterData = {
    1: {
      protocol: "ECO-2026-0004",
      status: "ABERTO · CRÍTICO",
      badgeClass: "badge-critical",
      title: "Margem do Córrego Limpo",
      desc: "9 cidadãos unificados em raio de 18m · Entulho civil + risco de obstrução hídrica.",
      action: "Despachar Caminhão Basculante (Porte G)",
      coords: "-23.55052, -46.63331"
    },
    2: {
      protocol: "ECO-2026-0011",
      status: "ABERTO · MÉDIO",
      badgeClass: "badge-critical",
      title: "Rua dos Ipês, Alt. 410",
      desc: "5 relatos deduplicados em raio de 14m · Sofá e colchão em passeio público.",
      action: "Despachar Caminhonete / Caçamba (Porte M)",
      coords: "-23.55310, -46.62980"
    },
    3: {
      protocol: "ECO-2026-0002",
      status: "RESOLVIDO · COMPROVADO",
      badgeClass: "badge-critical",
      title: "Praça da Estação (QR-04)",
      desc: "Limpeza concluída com foto do local limpo. 7 cidadãos notificados via Web Push.",
      action: "Destino: Ecoponto Central (4m³)",
      coords: "-23.54890, -46.63610"
    }
  };

  const dashCards = document.querySelectorAll(".dash-card");
  const mapPins = document.querySelectorAll(".map-pin");
  const dashDrawer = document.getElementById("dashDrawer");
  const filterChips = document.querySelectorAll(".filter-chip");

  function selectCluster(id) {
    dashCards.forEach((c) => c.classList.toggle("active", c.dataset.id === String(id)));
    mapPins.forEach((p) => p.classList.toggle("active", p.dataset.id === String(id)));

    const data = clusterData[id];
    if (dashDrawer && data) {
      const isResolved = id === "3" || id === 3;
      dashDrawer.innerHTML = `
        <div class="drawer-head">
          <span class="mono" style="color:${isResolved ? "#a78bfa" : "#f87171"};font-weight:700;">${data.status}</span>
          <span class="mono muted-text">${data.protocol}</span>
        </div>
        <h4>${data.title}</h4>
        <p>${data.desc}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:0.78rem;padding-top:10px;border-top:1px solid #27272a;">
          <span style="color:#6ee7b7;font-weight:600;">${data.action}</span>
          <span class="mono muted-text">${data.coords}</span>
        </div>
      `;
    }
  }

  dashCards.forEach((card) => {
    card.addEventListener("click", () => selectCluster(card.dataset.id));
  });

  mapPins.forEach((pin) => {
    pin.addEventListener("click", () => selectCluster(pin.dataset.id));
  });

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.dataset.filter;
      dashCards.forEach((card) => {
        const match = filter === "all" || card.dataset.priority === filter;
        card.style.display = match ? "block" : "none";
      });
    });
  });

  selectCluster(1);

  // 4. Interactive ROI Calculator
  const reportsRange = document.getElementById("reportsRange");
  const reportsVal = document.getElementById("reportsVal");
  const roiClusters = document.getElementById("roiClusters");
  const roiEliminated = document.getElementById("roiEliminated");
  const roiHours = document.getElementById("roiHours");
  const roiMoney = document.getElementById("roiMoney");

  function updateRoi() {
    if (!reportsRange) return;
    const reports = Number(reportsRange.value);
    const dedupRate = 0.78;
    const clusters = Math.round(reports * (1 - dedupRate));
    const eliminated = reports - clusters;
    const hoursSaved = Math.round((eliminated * 8) / 60);
    const moneySaved = Math.round(eliminated * 12.18);

    reportsVal.textContent = `${reports.toLocaleString("pt-BR")} relatos/mês`;
    roiClusters.textContent = `${clusters.toLocaleString("pt-BR")} focos`;
    roiEliminated.textContent = `${eliminated.toLocaleString("pt-BR")} chamados duplicados filtrados automaticamente`;
    roiHours.textContent = `${hoursSaved.toLocaleString("pt-BR")} h/mês`;
    roiMoney.textContent = `R$ ${moneySaved.toLocaleString("pt-BR")}/mês`;
  }

  if (reportsRange) {
    reportsRange.addEventListener("input", updateRoi);
    updateRoi();
  }

  // 5. Demo Request Modal
  const demoModal = document.getElementById("demoModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const demoForm = document.getElementById("demoForm");
  const modalSuccess = document.getElementById("modalSuccess");
  const resetModalBtn = document.getElementById("resetModalBtn");
  const planSelect = document.getElementById("planSelect");

  function openModal(planName) {
    if (!demoModal) return;
    if (planName && planSelect) {
      planSelect.value = planName;
    }
    demoModal.classList.add("open");
    demoModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!demoModal) return;
    demoModal.classList.remove("open");
    demoModal.setAttribute("aria-hidden", "true");
    if (demoForm && modalSuccess) {
      demoForm.hidden = false;
      modalSuccess.hidden = true;
      demoForm.reset();
    }
  }

  document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(trigger.dataset.plan);
    });
  });

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (resetModalBtn) resetModalBtn.addEventListener("click", closeModal);

  if (demoModal) {
    demoModal.addEventListener("click", (e) => {
      if (e.target === demoModal) closeModal();
    });
  }

  if (demoForm && modalSuccess) {
    demoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      demoForm.hidden = true;
      modalSuccess.hidden = false;
    });
  }
});
