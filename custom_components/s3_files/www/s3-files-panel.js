var $t = "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z", vt = "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z", bt = "M18,17H10.5L12.5,15H18M6,17V14.5L13.88,6.65C14.07,6.45 14.39,6.45 14.59,6.65L16.35,8.41C16.55,8.61 16.55,8.92 16.35,9.12L8.47,17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z";
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const I = globalThis, q = I.ShadowRoot && (I.ShadyCSS === void 0 || I.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Z = Symbol(), Y = /* @__PURE__ */ new WeakMap();
let dt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== Z) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (q && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = Y.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Y.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const wt = (r) => new dt(typeof r == "string" ? r : r + "", void 0, Z), yt = (r, ...t) => {
  const e = r.length === 1 ? r[0] : t.reduce((i, s, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + r[o + 1], r[0]);
  return new dt(e, r, Z);
}, xt = (r, t) => {
  if (q) r.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), s = I.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = e.cssText, r.appendChild(i);
  }
}, tt = q ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return wt(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: At, defineProperty: Et, getOwnPropertyDescriptor: St, getOwnPropertyNames: Ct, getOwnPropertySymbols: kt, getPrototypeOf: Nt } = Object, b = globalThis, et = b.trustedTypes, Pt = et ? et.emptyScript : "", Tt = b.reactiveElementPolyfillSupport, P = (r, t) => r, j = { toAttribute(r, t) {
  switch (t) {
    case Boolean:
      r = r ? Pt : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, t) {
  let e = r;
  switch (t) {
    case Boolean:
      e = r !== null;
      break;
    case Number:
      e = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(r);
      } catch {
        e = null;
      }
  }
  return e;
} }, G = (r, t) => !At(r, t), it = { attribute: !0, type: String, converter: j, reflect: !1, useDefault: !1, hasChanged: G };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), b.litPropertyMetadata ?? (b.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let E = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = it) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(t, i, e);
      s !== void 0 && Et(this.prototype, t, s);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: s, set: o } = St(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: s, set(n) {
      const l = s?.call(this);
      o?.call(this, n), this.requestUpdate(t, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? it;
  }
  static _$Ei() {
    if (this.hasOwnProperty(P("elementProperties"))) return;
    const t = Nt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const e = this.properties, i = [...Ct(e), ...kt(e)];
      for (const s of i) this.createProperty(s, e[s]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, s] of e) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const s = this._$Eu(e, i);
      s !== void 0 && this._$Eh.set(s, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const s of i) e.unshift(tt(s));
    } else t !== void 0 && e.push(tt(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return xt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    const i = this.constructor.elementProperties.get(t), s = this.constructor._$Eu(t, i);
    if (s !== void 0 && i.reflect === !0) {
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : j).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, s = i._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : j;
      this._$Em = s;
      const l = n.fromAttribute(e, o.type);
      this[s] = l ?? this._$Ej?.get(s) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, s = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (s === !1 && (o = this[t]), i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? G)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: s, wrapped: o }, n) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), s === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [s, o] of this._$Ep) this[s] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, o] of i) {
        const { wrapped: n } = o, l = this[s];
        n !== !0 || this._$AL.has(s) || l === void 0 || this.C(s, void 0, o, l);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[P("elementProperties")] = /* @__PURE__ */ new Map(), E[P("finalized")] = /* @__PURE__ */ new Map(), Tt?.({ ReactiveElement: E }), (b.reactiveElementVersions ?? (b.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const T = globalThis, rt = (r) => r, B = T.trustedTypes, st = B ? B.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, ct = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, pt = "?" + v, Ot = `<${pt}>`, x = document, H = () => x.createComment(""), U = (r) => r === null || typeof r != "object" && typeof r != "function", K = Array.isArray, Mt = (r) => K(r) || typeof r?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, N = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ot = /-->/g, nt = />/g, w = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), at = /'/g, lt = /"/g, ut = /^(?:script|style|textarea|title)$/i, Ht = (r) => (t, ...e) => ({ _$litType$: r, strings: t, values: e }), d = Ht(1), S = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), ht = /* @__PURE__ */ new WeakMap(), y = x.createTreeWalker(x, 129);
function _t(r, t) {
  if (!K(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return st !== void 0 ? st.createHTML(t) : t;
}
const Ut = (r, t) => {
  const e = r.length - 1, i = [];
  let s, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = N;
  for (let l = 0; l < e; l++) {
    const a = r[l];
    let _, m, p = -1, g = 0;
    for (; g < a.length && (n.lastIndex = g, m = n.exec(a), m !== null); ) g = n.lastIndex, n === N ? m[1] === "!--" ? n = ot : m[1] !== void 0 ? n = nt : m[2] !== void 0 ? (ut.test(m[2]) && (s = RegExp("</" + m[2], "g")), n = w) : m[3] !== void 0 && (n = w) : n === w ? m[0] === ">" ? (n = s ?? N, p = -1) : m[1] === void 0 ? p = -2 : (p = n.lastIndex - m[2].length, _ = m[1], n = m[3] === void 0 ? w : m[3] === '"' ? lt : at) : n === lt || n === at ? n = w : n === ot || n === nt ? n = N : (n = w, s = void 0);
    const $ = n === w && r[l + 1].startsWith("/>") ? " " : "";
    o += n === N ? a + Ot : p >= 0 ? (i.push(_), a.slice(0, p) + ct + a.slice(p) + v + $) : a + v + (p === -2 ? l : $);
  }
  return [_t(r, o + (r[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class R {
  constructor({ strings: t, _$litType$: e }, i) {
    let s;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [_, m] = Ut(t, e);
    if (this.el = R.createElement(_, i), y.currentNode = this.el.content, e === 2 || e === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (s = y.nextNode()) !== null && a.length < l; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const p of s.getAttributeNames()) if (p.endsWith(ct)) {
          const g = m[n++], $ = s.getAttribute(p).split(v), L = /([.?@])?(.*)/.exec(g);
          a.push({ type: 1, index: o, name: L[2], strings: $, ctor: L[1] === "." ? zt : L[1] === "?" ? Dt : L[1] === "@" ? Lt : F }), s.removeAttribute(p);
        } else p.startsWith(v) && (a.push({ type: 6, index: o }), s.removeAttribute(p));
        if (ut.test(s.tagName)) {
          const p = s.textContent.split(v), g = p.length - 1;
          if (g > 0) {
            s.textContent = B ? B.emptyScript : "";
            for (let $ = 0; $ < g; $++) s.append(p[$], H()), y.nextNode(), a.push({ type: 2, index: ++o });
            s.append(p[g], H());
          }
        }
      } else if (s.nodeType === 8) if (s.data === pt) a.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = s.data.indexOf(v, p + 1)) !== -1; ) a.push({ type: 7, index: o }), p += v.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = x.createElement("template");
    return i.innerHTML = t, i;
  }
}
function C(r, t, e = r, i) {
  if (t === S) return t;
  let s = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = U(t) ? void 0 : t._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(r), s._$AT(r, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = s : e._$Cl = s), s !== void 0 && (t = C(r, s._$AS(r, t.values), s, i)), t;
}
class Rt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, s = (t?.creationScope ?? x).importNode(e, !0);
    y.currentNode = s;
    let o = y.nextNode(), n = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let _;
        a.type === 2 ? _ = new z(o, o.nextSibling, this, t) : a.type === 1 ? _ = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (_ = new It(o, this, t)), this._$AV.push(_), a = i[++l];
      }
      n !== a?.index && (o = y.nextNode(), n++);
    }
    return y.currentNode = x, s;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class z {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, s) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = C(this, t, e), U(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== S && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Mt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(x.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, s = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = R.createElement(_t(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(e);
    else {
      const o = new Rt(s, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = ht.get(t.strings);
    return e === void 0 && ht.set(t.strings, e = new R(t)), e;
  }
  k(t) {
    K(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, s = 0;
    for (const o of t) s === e.length ? e.push(i = new z(this.O(H()), this.O(H()), this, this.options)) : i = e[s], i._$AI(o), s++;
    s < e.length && (this._$AR(i && i._$AB.nextSibling, s), e.length = s);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = rt(t).nextSibling;
      rt(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class F {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, s, o) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(t, e = this, i, s) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = C(this, t, e, 0), n = !U(t) || t !== this._$AH && t !== S, n && (this._$AH = t);
    else {
      const l = t;
      let a, _;
      for (t = o[0], a = 0; a < o.length - 1; a++) _ = C(this, l[i + a], e, a), _ === S && (_ = this._$AH[a]), n || (n = !U(_) || _ !== this._$AH[a]), _ === h ? t = h : t !== h && (t += (_ ?? "") + o[a + 1]), this._$AH[a] = _;
    }
    n && !s && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class zt extends F {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class Dt extends F {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class Lt extends F {
  constructor(t, e, i, s, o) {
    super(t, e, i, s, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = C(this, t, e, 0) ?? h) === S) return;
    const i = this._$AH, s = t === h && i !== h || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== h && (i === h || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class It {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    C(this, t);
  }
}
const jt = T.litHtmlPolyfillSupport;
jt?.(R, z), (T.litHtmlVersions ?? (T.litHtmlVersions = [])).push("3.3.3");
const Bt = (r, t, e) => {
  const i = e?.renderBefore ?? t;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = s = new z(t.insertBefore(H(), o), o, void 0, e ?? {});
  }
  return s._$AI(r), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const O = globalThis;
class M extends E {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Bt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return S;
  }
}
M._$litElement$ = !0, M.finalized = !0, O.litElementHydrateSupport?.({ LitElement: M });
const Ft = O.litElementPolyfillSupport;
Ft?.({ LitElement: M });
(O.litElementVersions ?? (O.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Vt = { attribute: !0, type: String, converter: j, reflect: !1, hasChanged: G }, Wt = (r = Vt, t, e) => {
  const { kind: i, metadata: s } = e;
  let o = globalThis.litPropertyMetadata.get(s);
  if (o === void 0 && globalThis.litPropertyMetadata.set(s, o = /* @__PURE__ */ new Map()), i === "setter" && ((r = Object.create(r)).wrapped = !0), o.set(e.name, r), i === "accessor") {
    const { name: n } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(n, a, r, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, r, l), l;
    } };
  }
  if (i === "setter") {
    const { name: n } = e;
    return function(l) {
      const a = this[n];
      t.call(this, l), this.requestUpdate(n, a, r, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function D(r) {
  return (t, e) => typeof e == "object" ? Wt(r, t, e) : ((i, s, o) => {
    const n = s.hasOwnProperty(o);
    return s.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(s, o) : void 0;
  })(r, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function f(r) {
  return D({ ...r, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const qt = (r, t, e) => (e.configurable = !0, e.enumerable = !0, Reflect.decorate && typeof t != "object" && Object.defineProperty(r, t, e), e);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Zt(r, t) {
  return (e, i, s) => {
    const o = (n) => n.renderRoot?.querySelector(r) ?? null;
    return qt(e, i, { get() {
      return o(this);
    } });
  };
}
const Gt = "s3_files";
async function k(r, t, e = {}) {
  const s = (await r.callService(
    Gt,
    t,
    e,
    void 0,
    // Let the caller deal with failures: the panel shows them in place, which
    // is where the user is looking, rather than as a toast.
    !1,
    !0
  ))?.response;
  if (s == null)
    throw new Error(
      `s3_files.${t} did not return a response. If this integration was just updated, reload the page.`
    );
  return s;
}
async function Kt(r) {
  return k(r, "get_info");
}
async function Xt(r, t) {
  return (await k(r, "list_files", { path: t })).files ?? [];
}
async function Jt(r, t) {
  const e = await k(r, "read_file", { path: t });
  return String(e.content ?? "");
}
async function Qt(r, t, e, i = !0) {
  const s = await k(
    r,
    "write_file",
    { path: t, content: e, overwrite: i }
  );
  return {
    path: String(s.path ?? t),
    size: Number(s.size ?? 0)
  };
}
async function Yt(r, t) {
  await k(r, "delete_file", { path: t });
}
async function te(r, t, e, i = !1) {
  const s = await k(r, "move_file", {
    source: t,
    destination: e,
    overwrite: i
  });
  return String(s.path ?? e);
}
const ee = /* @__PURE__ */ new Set([
  "md",
  "markdown",
  "txt",
  "text",
  "log",
  "csv",
  "tsv",
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "xml",
  "html",
  "css",
  "js",
  "ts",
  "py",
  "sh",
  "sql"
]), ie = {
  md: "mdi:language-markdown",
  markdown: "mdi:language-markdown",
  txt: "mdi:text-box-outline",
  log: "mdi:text-box-outline",
  csv: "mdi:table",
  tsv: "mdi:table",
  json: "mdi:code-json",
  yaml: "mdi:file-cog-outline",
  yml: "mdi:file-cog-outline",
  toml: "mdi:file-cog-outline",
  xml: "mdi:xml",
  html: "mdi:language-html5",
  css: "mdi:language-css3",
  js: "mdi:language-javascript",
  ts: "mdi:language-typescript",
  py: "mdi:language-python",
  sh: "mdi:console",
  pdf: "mdi:file-pdf-box",
  png: "mdi:file-image-outline",
  jpg: "mdi:file-image-outline",
  jpeg: "mdi:file-image-outline",
  gif: "mdi:file-image-outline",
  webp: "mdi:file-image-outline",
  svg: "mdi:svg",
  zip: "mdi:folder-zip-outline",
  gz: "mdi:folder-zip-outline",
  tar: "mdi:folder-zip-outline",
  mp3: "mdi:music",
  mp4: "mdi:video-outline"
};
function X(r) {
  const t = ft(r), e = t.lastIndexOf(".");
  return e <= 0 ? "" : t.slice(e + 1).toLowerCase();
}
function ft(r) {
  const t = (r ?? "").replace(/\/+$/, ""), e = t.lastIndexOf("/");
  return e === -1 ? t : t.slice(e + 1);
}
function J(r, t) {
  const e = (r ?? "").replace(/^\/+|\/+$/g, ""), i = (t ?? "").replace(/^\/+/g, "");
  return e ? i ? `${e}/${i}` : e : i;
}
function W(r) {
  const t = (r ?? "").replace(/\/+$/g, ""), e = t.lastIndexOf("/");
  return e === -1 ? "" : t.slice(0, e);
}
function re(r, t = "Files") {
  const e = [{ label: t, path: "" }];
  let i = "";
  for (const s of (r ?? "").split("/").filter(Boolean))
    i = J(i, s), e.push({ label: s, path: i });
  return e;
}
function se(r) {
  if (r == null) return "";
  if (r < 1024) return `${r} B`;
  const t = ["KB", "MB", "GB", "TB"];
  let e = r / 1024, i = 0;
  for (; e >= 1024 && i < t.length - 1; )
    e /= 1024, i += 1;
  return `${e < 10 ? e.toFixed(1) : Math.round(e)} ${t[i]}`;
}
function oe(r) {
  const t = X(r);
  return t === "" || ee.has(t);
}
function ne(r) {
  return r.is_folder ? "mdi:folder-outline" : ie[X(r.path)] ?? "mdi:file-outline";
}
function mt(r) {
  const t = r.lastIndexOf(".");
  return t <= 0 ? r : r.slice(0, t);
}
function ae(r, t = !0) {
  return r.is_folder || t ? r.name : mt(r.name);
}
function le(r, t = !0) {
  if (!t) return "";
  if (r.is_folder) return "Folder";
  const e = [];
  return r.size !== null && r.size !== void 0 && e.push(se(r.size)), r.last_modified && e.push(r.last_modified.slice(0, 10)), e.join(" · ");
}
function gt(r, t = "md") {
  const e = (r ?? "").trim().replace(/\.+$/, "");
  return e ? /\.[A-Za-z0-9]+$/.test(e) ? e : `${e}.${t}` : "";
}
function he(r, t) {
  const e = gt(t, X(r) || "md");
  return e ? J(W(r), e) : r;
}
function de(r) {
  return [...r].sort((t, e) => t.is_folder !== e.is_folder ? t.is_folder ? -1 : 1 : t.path.localeCompare(e.path, void 0, { sensitivity: "base" }));
}
var ce = Object.defineProperty, u = (r, t, e, i) => {
  for (var s = void 0, o = r.length - 1, n; o >= 0; o--)
    (n = r[o]) && (s = n(t, e, s) || s);
  return s && ce(t, e, s), s;
};
const Q = class Q extends M {
  constructor() {
    super(...arguments), this.narrow = !1, this._info = null, this._path = "", this._entries = [], this._loading = !1, this._error = "", this._editorOpen = !1, this._editorIsNew = !1, this._editorName = "", this._editorContent = "", this._editorPreview = !1, this._editorError = "", this._saving = !1, this._deleteTarget = null, this._renameTarget = null, this._renameName = "", this._renameError = "", this._renaming = !1;
  }
  willUpdate(t) {
    t.has("hass") && this.hass && !this._info && !this._loading && this._start();
  }
  get _permissions() {
    return this._info?.permissions ?? {
      allow_list: !1,
      allow_read: !1,
      allow_write: !1,
      allow_delete: !1,
      allow_move: !1,
      allow_mkdir: !1
    };
  }
  get _rootLabel() {
    return this._info ? this._info.scope ? this._info.scope.split("/").pop() || "Files" : "Bucket" : "Files";
  }
  /** Whether rows show the extension, size and date. Defaults to showing them. */
  get _showDetails() {
    return this._info?.show_file_details ?? !0;
  }
  async _start() {
    this._loading = !0, this._error = "";
    try {
      this._info = await Kt(this.hass), await this._load(this._path);
    } catch (t) {
      this._error = A(t);
    } finally {
      this._loading = !1;
    }
  }
  async _load(t) {
    if (!this._permissions.allow_list) {
      this._path = t, this._entries = [];
      return;
    }
    this._loading = !0, this._error = "";
    try {
      this._path = t, this._entries = de(await Xt(this.hass, t));
    } catch (e) {
      this._error = A(e), this._entries = [];
    } finally {
      this._loading = !1;
    }
  }
  _activate(t) {
    if (t.is_folder) {
      this._load(t.path);
      return;
    }
    this._permissions.allow_read && this._openExisting(t);
  }
  async _openExisting(t) {
    if (this._editorOpen = !0, this._editorIsNew = !1, this._editorError = "", this._editorPreview = !1, this._editorName = t.path, this._editorContent = "", !oe(t.path)) {
      this._editorError = "This does not look like a text file. Editing it here is not supported.";
      return;
    }
    try {
      this._editorContent = await Jt(this.hass, t.path);
    } catch (e) {
      this._editorError = A(e);
    }
  }
  _openNew() {
    this._editorOpen = !0, this._editorIsNew = !0, this._editorError = "", this._editorPreview = !1, this._editorName = "", this._editorContent = "";
  }
  /** The path this file will be saved to. */
  get _targetPath() {
    return this._editorIsNew ? J(this._path, gt(this._editorName)) : this._editorName;
  }
  async _save() {
    if (this._editorIsNew && !this._editorName.trim()) {
      this._editorError = "Give the file a name.";
      return;
    }
    const t = this._targetPath;
    this._saving = !0, this._editorError = "";
    try {
      const e = await Qt(this.hass, t, this._editorContent, !0);
      this._editorOpen = !1, await this._load(W(e.path));
    } catch (e) {
      this._editorError = A(e);
    } finally {
      this._saving = !1;
    }
  }
  async _delete() {
    const t = this._deleteTarget;
    if (t) {
      this._deleteTarget = null;
      try {
        await Yt(this.hass, t.path), await this._load(this._path);
      } catch (e) {
        this._error = A(e);
      }
    }
  }
  _rowMenuItems(t) {
    const e = [];
    return this._permissions.allow_read && e.push({
      label: "Open",
      path: vt,
      action: () => void this._openExisting(t)
    }), this._permissions.allow_move && !t.is_folder && e.push({
      label: "Rename",
      path: bt,
      action: () => this._openRename(t)
    }), this._permissions.allow_delete && !t.is_folder && e.push({
      label: "Delete",
      path: $t,
      action: () => this._deleteTarget = t,
      warning: !0
    }), e;
  }
  _openRename(t) {
    this._renameTarget = t, this._renameError = "", this._renaming = !1, this._renameName = mt(ft(t.path));
  }
  /** Where the renamed file will land. */
  get _renameDestination() {
    return this._renameTarget ? he(this._renameTarget.path, this._renameName) : "";
  }
  async _rename() {
    const t = this._renameTarget;
    if (!t) return;
    if (!this._renameName.trim()) {
      this._renameError = "Give the file a name.";
      return;
    }
    const e = this._renameDestination;
    if (e === t.path) {
      this._renameError = "That is already this file's name.";
      return;
    }
    if (W(e) === this._path && this._entries.some((i) => i.path === e)) {
      this._renameError = `${e} already exists. Choose another name.`;
      return;
    }
    this._renaming = !0, this._renameError = "";
    try {
      await te(this.hass, t.path, e, !1), this._renameTarget = null, await this._load(this._path);
    } catch (i) {
      this._renameError = A(i);
    } finally {
      this._renaming = !1;
    }
  }
  render() {
    return this.hass ? d`
      <div class="content">
        <div class="toolbar">
          <div class="heading">
            <ha-menu-button></ha-menu-button>
            <ha-icon icon="mdi:folder-network-outline"></ha-icon>
            <div class="heading-text">
              <span>Notes</span>
              <span class="subtitle">${this._subtitle()}</span>
            </div>
          </div>
          <div class="toolbar-actions">
            <ha-button @click=${() => this._load(this._path)} title="Refresh">
              <ha-icon icon="mdi:refresh"></ha-icon>
            </ha-button>
            ${this._permissions.allow_write ? d`<ha-button @click=${this._openNew}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  <span class="new-label">New file</span>
                </ha-button>` : h}
          </div>
        </div>

        ${this._permissions.allow_list ? this._renderBreadcrumbs() : h}
        ${this._error ? d`<div class="error">${this._error}</div>` : h}
        ${this._renderList()}
      </div>

      ${this._renderEditor()} ${this._renderRenameDialog()}
      ${this._renderDeleteDialog()}
    ` : d``;
  }
  _subtitle() {
    return this._info ? `in ${this._info.scope ? this._info.scope : "the whole bucket"} of ${this._info.bucket}` : "";
  }
  _renderBreadcrumbs() {
    const t = re(this._path, this._rootLabel);
    return d`
      <nav>
        ${t.map((e, i) => {
      const s = i === t.length - 1;
      return d`${i > 0 ? d`<span class="sep">/</span>` : h}
            <button
              class=${s ? "current" : ""}
              ?disabled=${s}
              @click=${() => this._load(e.path)}
            >
              ${e.label}
            </button>`;
    })}
      </nav>
    `;
  }
  _renderList() {
    return this._permissions.allow_list ? this._loading && this._entries.length === 0 ? d`<div class="list">
        <div class="empty">Loading…</div>
      </div>` : this._entries.length === 0 && !this._error ? d`<div class="list">
        <div class="empty">Nothing here yet.</div>
      </div>` : d`<div class="list">
      ${this._entries.map((t) => this._renderRow(t))}
    </div>` : d`<div class="list">
        <div class="empty">
          Listing is switched off for this integration. Turn on "List files and
          folders" in its options to browse them here.
        </div>
      </div>`;
  }
  _renderRow(t) {
    const e = t.is_folder || this._permissions.allow_read, i = this._showDetails ? le(t, !0) : "", s = this._rowMenuItems(t);
    return d`
      <div class="row" data-clickable=${e}>
        <ha-icon
          .icon=${ne(t)}
          @click=${() => this._activate(t)}
        ></ha-icon>
        <div class="row-text" @click=${() => this._activate(t)}>
          <div class="row-title">${ae(t, this._showDetails)}</div>
          ${i ? d`<div class="row-meta">${i}</div>` : h}
        </div>
        ${s.length ? d`<ha-icon-overflow-menu
              .narrow=${!0}
              .items=${s}
            ></ha-icon-overflow-menu>` : h}
      </div>
    `;
  }
  _editorHeading() {
    return this._editorIsNew ? "New file" : this._permissions.allow_read ? "Edit file" : "File";
  }
  /** The only control above the text: a switch between writing and preview. */
  _renderPreviewToggle() {
    return d`
      <div class="markdown-bar">
        <button
          data-active=${this._editorPreview}
          title=${this._editorPreview ? "Back to writing" : "Preview the note"}
          @click=${() => this._editorPreview = !this._editorPreview}
        >
          ${this._editorPreview ? "Write" : "Preview"}
        </button>
      </div>
    `;
  }
  _renderEditor() {
    const t = this._permissions.allow_write;
    return d`
      <ha-dialog
        .open=${this._editorOpen}
        .heading=${this._editorHeading()}
        @closed=${() => this._editorOpen = !1}
      >
        <div class="editor">
          ${this._editorIsNew ? d`<div class="field">
                <label for="s3-files-name">File name</label>
                <input
                  id="s3-files-name"
                  type="text"
                  .value=${this._editorName}
                  placeholder="My note"
                  ?disabled=${!t}
                  @input=${(e) => {
      this._editorName = e.target.value;
    }}
                  @keydown=${(e) => {
      e.key === "Enter" && (e.preventDefault(), this._contentArea?.focus());
    }}
                />
                <div class="where">Saved to ${this._targetPath || "…"}</div>
              </div>` : d`<div class="field">
                <label>File</label>
                <div class="where">${this._editorName}</div>
              </div>`}
          ${this._renderPreviewToggle()}
          ${this._editorPreview ? d`<div class="preview">
                <ha-markdown .content=${this._editorContent}></ha-markdown>
              </div>` : d`<textarea
                class="markdown"
                .value=${this._editorContent}
                placeholder="Write your note…"
                ?disabled=${!t}
                @input=${(e) => {
      this._editorContent = e.target.value;
    }}
              ></textarea>`}
          ${this._editorError ? d`<div class="error">${this._editorError}</div>` : h}
          ${t ? h : d`<div class="hint">
                Writing is switched off for this integration, so this file cannot
                be saved from here.
              </div>`}
        </div>

        <ha-dialog-footer slot="footer">
          ${this._permissions.allow_delete && !this._editorIsNew ? d`<ha-button
                slot="secondaryAction"
                variant="danger"
                @click=${() => {
      const e = this._entries.find(
        (i) => i.path === this._editorName
      );
      e && (this._deleteTarget = e);
    }}
              >
                Delete
              </ha-button>` : h}
          <ha-button slot="secondaryAction" @click=${() => this._editorOpen = !1}>
            ${t ? "Cancel" : "Close"}
          </ha-button>
          ${t ? d`<ha-button
                slot="primaryAction"
                .disabled=${this._saving}
                @click=${this._save}
              >
                ${this._editorIsNew ? "Create" : "Save"}
              </ha-button>` : h}
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
  _renderRenameDialog() {
    const t = this._renameTarget;
    return d`
      <ha-dialog
        .open=${t !== null}
        .heading=${"Rename file"}
        @closed=${() => this._renameTarget = null}
      >
        <div class="editor">
          <div class="field">
            <label for="s3-files-rename">New name</label>
            <input
              id="s3-files-rename"
              type="text"
              .value=${this._renameName}
              ?disabled=${this._renaming}
              @input=${(e) => {
      this._renameName = e.target.value, this._renameError = "";
    }}
              @keydown=${(e) => {
      e.key === "Enter" && (e.preventDefault(), this._rename());
    }}
            />
            <div class="where">
              Renamed to ${this._renameDestination || "…"}
            </div>
          </div>
          ${this._renameError ? d`<div class="error">${this._renameError}</div>` : h}
        </div>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" @click=${() => this._renameTarget = null}>
            Cancel
          </ha-button>
          <ha-button
            slot="primaryAction"
            .disabled=${this._renaming}
            @click=${this._rename}
          >
            Rename
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
  _renderDeleteDialog() {
    const t = this._deleteTarget;
    return d`
      <ha-dialog
        .open=${t !== null}
        .heading=${"Delete file"}
        @closed=${() => this._deleteTarget = null}
      >
        <p>
          Delete <strong>${t?.path}</strong>? Deleting an S3 object cannot
          be undone.
        </p>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" @click=${() => this._deleteTarget = null}>
            Cancel
          </ha-button>
          <ha-button
            slot="primaryAction"
            variant="danger"
            @click=${this._delete}
          >
            Delete
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
};
Q.styles = yt`
    :host {
      display: block;
      padding: 16px;
      box-sizing: border-box;
      height: 100%;
    }
    .content {
      max-width: 900px;
      margin: 0 auto;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }
    .heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 22px;
      font-weight: 400;
      min-width: 0;
    }
    .heading-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .heading span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .subtitle {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    nav {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
      margin: 12px 0 8px;
      font-size: 14px;
    }
    nav button {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      font: inherit;
      padding: 2px 4px;
      border-radius: 4px;
    }
    nav button:hover {
      background: var(--secondary-background-color);
    }
    nav .current {
      color: var(--primary-text-color);
      cursor: default;
    }
    nav .sep {
      color: var(--secondary-text-color);
    }
    .list {
      background: var(--card-background-color);
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      overflow: hidden;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
      min-height: 48px;
      box-sizing: border-box;
    }
    .row:last-child {
      border-bottom: none;
    }
    .row[data-clickable="true"] {
      cursor: pointer;
    }
    .row[data-clickable="true"]:hover {
      background: var(--secondary-background-color);
    }
    .row-text {
      flex: 1;
      min-width: 0;
    }
    .row-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row-meta {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .empty,
    .error {
      padding: 24px 12px;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .error {
      color: var(--error-color, #db4437);
    }

    /* -- editor ---------------------------------------------------------- */
    .editor {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: min(680px, 85vw);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field label {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .field input,
    .editor textarea {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.25));
      border-radius: 8px;
      padding: 8px 10px;
      box-sizing: border-box;
      width: 100%;
    }
    .field input:focus,
    .editor textarea:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .editor textarea {
      min-height: 45vh;
      resize: vertical;
      font-family: var(--code-font-family, ui-monospace, monospace);
      line-height: 1.5;
      tab-size: 2;
    }
    .where {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .markdown-bar {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-wrap: wrap;
    }
    .markdown-bar button {
      background: none;
      border: 1px solid transparent;
      border-radius: 6px;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
      min-width: 32px;
      padding: 4px 8px;
    }
    .markdown-bar button:hover {
      background: var(--secondary-background-color);
    }
    .markdown-bar button[data-active="true"] {
      background: var(--secondary-background-color);
      border-color: var(--divider-color, rgba(0, 0, 0, 0.2));
    }
    .markdown-bar .spacer {
      flex: 1;
    }
    .preview {
      min-height: 45vh;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.25));
      border-radius: 8px;
      padding: 8px 12px;
      overflow: auto;
      background: var(--card-background-color);
    }
    .hint {
      font-size: 13px;
      color: var(--secondary-text-color);
      padding-top: 4px;
    }
    @media (max-width: 600px) {
      :host {
        padding: 12px 8px;
      }
      .heading {
        font-size: 18px;
      }
      .new-label {
        display: none;
      }
      .editor {
        min-width: auto;
      }
    }
  `;
let c = Q;
u([
  D({ attribute: !1 })
], c.prototype, "hass");
u([
  D({ type: Boolean })
], c.prototype, "narrow");
u([
  D({ attribute: !1 })
], c.prototype, "route");
u([
  D({ attribute: !1 })
], c.prototype, "panel");
u([
  f()
], c.prototype, "_info");
u([
  f()
], c.prototype, "_path");
u([
  f()
], c.prototype, "_entries");
u([
  f()
], c.prototype, "_loading");
u([
  f()
], c.prototype, "_error");
u([
  f()
], c.prototype, "_editorOpen");
u([
  f()
], c.prototype, "_editorIsNew");
u([
  f()
], c.prototype, "_editorName");
u([
  f()
], c.prototype, "_editorContent");
u([
  f()
], c.prototype, "_editorPreview");
u([
  f()
], c.prototype, "_editorError");
u([
  f()
], c.prototype, "_saving");
u([
  f()
], c.prototype, "_deleteTarget");
u([
  f()
], c.prototype, "_renameTarget");
u([
  f()
], c.prototype, "_renameName");
u([
  f()
], c.prototype, "_renameError");
u([
  f()
], c.prototype, "_renaming");
u([
  Zt("textarea.markdown")
], c.prototype, "_contentArea");
function A(r) {
  return r instanceof Error ? r.message : String(r);
}
customElements.get("s3-files-panel") || customElements.define("s3-files-panel", c);
export {
  c as S3FilesPanel
};
