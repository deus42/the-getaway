import{r as i,j as t}from"./vendor-Cc93p67d.js";const j=({children:c,onClick:p,variant:x="primary",size:n="medium",disabled:e=!1,fullWidth:f=!1,icon:a,type:m="button",...b})=>{const[s,l]=i.useState(!1),[g,o]=i.useState(!1),d={primary:{bg:"linear-gradient(135deg, #38bdf8, #0ea5e9)",border:"#38bdf8",glow:"rgba(56, 189, 248, 0.6)",text:"#0b1120"},secondary:{bg:"linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(100, 116, 139, 0.4))",border:"rgba(148, 163, 184, 0.5)",glow:"rgba(148, 163, 184, 0.4)",text:"#f8fafc"},danger:{bg:"linear-gradient(135deg, #ef4444, #dc2626)",border:"#ef4444",glow:"rgba(239, 68, 68, 0.6)",text:"#ffffff"},success:{bg:"linear-gradient(135deg, #34d399, #10b981)",border:"#34d399",glow:"rgba(52, 211, 153, 0.6)",text:"#0b1120"}},u={small:"0.3rem 0.6rem",medium:"0.5rem 1rem",large:"0.7rem 1.4rem"},w={small:"0.7rem",medium:"0.8rem",large:"0.95rem"},r=d[x],y={position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",padding:u[n],fontSize:w[n],fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:r.text,background:e?"rgba(100, 116, 139, 0.3)":r.bg,border:`1.5px solid ${e?"rgba(148, 163, 184, 0.3)":r.border}`,borderRadius:"999px",cursor:e?"not-allowed":"pointer",opacity:e?.5:1,textShadow:e?"none":"0 1px 2px rgba(0, 0, 0, 0.4)",boxShadow:e?"none":g?`inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px ${r.glow}`:s?`0 0 20px ${r.glow}, 0 6px 16px rgba(0, 0, 0, 0.4)`:`0 0 12px ${r.glow}80, 0 4px 8px rgba(0, 0, 0, 0.3)`,transform:e?"none":g?"translateY(1px) scale(0.98)":s?"translateY(-2px) scale(1.02)":"translateY(0) scale(1)",transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",width:f?"100%":"auto",userSelect:"none",WebkitTapHighlightColor:"transparent"},h={fontSize:"1.1em",filter:e?"none":`drop-shadow(0 0 4px ${r.glow})`};return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
        @keyframes buttonRipple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}),t.jsxs("button",{type:m,onClick:e?void 0:p,onMouseEnter:()=>!e&&l(!0),onMouseLeave:()=>{l(!1),o(!1)},onMouseDown:()=>!e&&o(!0),onMouseUp:()=>o(!1),style:y,disabled:e,...b,children:[a&&t.jsx("span",{style:h,children:a}),c]})]})};export{j as E};
