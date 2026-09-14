var bt = "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z", wt = "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z", yt = "M18,17H10.5L12.5,15H18M6,17V14.5L13.88,6.65C14.07,6.45 14.39,6.45 14.59,6.65L16.35,8.41C16.55,8.61 16.55,8.92 16.35,9.12L8.47,17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z";
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const L = globalThis, q = L.ShadowRoot && (L.ShadyCSS === void 0 || L.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Z = Symbol(), Y = /* @__PURE__ */ new WeakMap();
let pt = class {
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
const xt = (s) => new pt(typeof s == "string" ? s : s + "", void 0, Z), At = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new pt(e, s, Z);
}, Et = (s, t) => {
  if (q) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = L.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, tt = q ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return xt(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: St, defineProperty: kt, getOwnPropertyDescriptor: Ct, getOwnPropertyNames: Nt, getOwnPropertySymbols: Pt, getPrototypeOf: Tt } = Object, b = globalThis, et = b.trustedTypes, Ot = et ? et.emptyScript : "", Mt = b.reactiveElementPolyfillSupport, P = (s, t) => s, j = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? Ot : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, X = (s, t) => !St(s, t), it = { attribute: !0, type: String, converter: j, reflect: !1, useDefault: !1, hasChanged: X };
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
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && kt(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = Ct(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: r, set(n) {
      const l = r?.call(this);
      o?.call(this, n), this.requestUpdate(t, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? it;
  }
  static _$Ei() {
    if (this.hasOwnProperty(P("elementProperties"))) return;
    const t = Tt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const e = this.properties, i = [...Nt(e), ...Pt(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(tt(r));
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
    return Et(t, this.constructor.elementStyles), t;
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
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : j).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = i.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : j;
      this._$Em = r;
      const l = n.fromAttribute(e, o.type);
      this[r] = l ?? this._$Ej?.get(r) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[t]), i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? X)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: o }, n) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, o] of i) {
        const { wrapped: n } = o, l = this[r];
        n !== !0 || this._$AL.has(r) || l === void 0 || this.C(r, void 0, o, l);
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
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[P("elementProperties")] = /* @__PURE__ */ new Map(), E[P("finalized")] = /* @__PURE__ */ new Map(), Mt?.({ ReactiveElement: E }), (b.reactiveElementVersions ?? (b.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const T = globalThis, st = (s) => s, B = T.trustedTypes, rt = B ? B.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, ut = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, _t = "?" + v, Ht = `<${_t}>`, x = document, H = () => x.createComment(""), R = (s) => s === null || typeof s != "object" && typeof s != "function", G = Array.isArray, Rt = (s) => G(s) || typeof s?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, N = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ot = /-->/g, nt = />/g, w = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), at = /'/g, lt = /"/g, ft = /^(?:script|style|textarea|title)$/i, Ut = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), d = Ut(1), S = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), ht = /* @__PURE__ */ new WeakMap(), y = x.createTreeWalker(x, 129);
function mt(s, t) {
  if (!G(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return rt !== void 0 ? rt.createHTML(t) : t;
}
const zt = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = N;
  for (let l = 0; l < e; l++) {
    const a = s[l];
    let c, p, u = -1, g = 0;
    for (; g < a.length && (n.lastIndex = g, p = n.exec(a), p !== null); ) g = n.lastIndex, n === N ? p[1] === "!--" ? n = ot : p[1] !== void 0 ? n = nt : p[2] !== void 0 ? (ft.test(p[2]) && (r = RegExp("</" + p[2], "g")), n = w) : p[3] !== void 0 && (n = w) : n === w ? p[0] === ">" ? (n = r ?? N, u = -1) : p[1] === void 0 ? u = -2 : (u = n.lastIndex - p[2].length, c = p[1], n = p[3] === void 0 ? w : p[3] === '"' ? lt : at) : n === lt || n === at ? n = w : n === ot || n === nt ? n = N : (n = w, r = void 0);
    const $ = n === w && s[l + 1].startsWith("/>") ? " " : "";
    o += n === N ? a + Ht : u >= 0 ? (i.push(c), a.slice(0, u) + ut + a.slice(u) + v + $) : a + v + (u === -2 ? l : $);
  }
  return [mt(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class U {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [c, p] = zt(t, e);
    if (this.el = U.createElement(c, i), y.currentNode = this.el.content, e === 2 || e === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (r = y.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const u of r.getAttributeNames()) if (u.endsWith(ut)) {
          const g = p[n++], $ = r.getAttribute(u).split(v), I = /([.?@])?(.*)/.exec(g);
          a.push({ type: 1, index: o, name: I[2], strings: $, ctor: I[1] === "." ? It : I[1] === "?" ? Lt : I[1] === "@" ? jt : F }), r.removeAttribute(u);
        } else u.startsWith(v) && (a.push({ type: 6, index: o }), r.removeAttribute(u));
        if (ft.test(r.tagName)) {
          const u = r.textContent.split(v), g = u.length - 1;
          if (g > 0) {
            r.textContent = B ? B.emptyScript : "";
            for (let $ = 0; $ < g; $++) r.append(u[$], H()), y.nextNode(), a.push({ type: 2, index: ++o });
            r.append(u[g], H());
          }
        }
      } else if (r.nodeType === 8) if (r.data === _t) a.push({ type: 2, index: o });
      else {
        let u = -1;
        for (; (u = r.data.indexOf(v, u + 1)) !== -1; ) a.push({ type: 7, index: o }), u += v.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = x.createElement("template");
    return i.innerHTML = t, i;
  }
}
function k(s, t, e = s, i) {
  if (t === S) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = R(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = r : e._$Cl = r), r !== void 0 && (t = k(s, r._$AS(s, t.values), r, i)), t;
}
class Dt {
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
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? x).importNode(e, !0);
    y.currentNode = r;
    let o = y.nextNode(), n = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let c;
        a.type === 2 ? c = new z(o, o.nextSibling, this, t) : a.type === 1 ? c = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (c = new Bt(o, this, t)), this._$AV.push(c), a = i[++l];
      }
      n !== a?.index && (o = y.nextNode(), n++);
    }
    return y.currentNode = x, r;
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
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
    t = k(this, t, e), R(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== S && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Rt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && R(this._$AH) ? this._$AA.nextSibling.data = t : this.T(x.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = U.createElement(mt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const o = new Dt(r, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = ht.get(t.strings);
    return e === void 0 && ht.set(t.strings, e = new U(t)), e;
  }
  k(t) {
    G(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new z(this.O(H()), this.O(H()), this, this.options)) : i = e[r], i._$AI(o), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = st(t).nextSibling;
      st(t).remove(), t = i;
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
  constructor(t, e, i, r, o) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(t, e = this, i, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = k(this, t, e, 0), n = !R(t) || t !== this._$AH && t !== S, n && (this._$AH = t);
    else {
      const l = t;
      let a, c;
      for (t = o[0], a = 0; a < o.length - 1; a++) c = k(this, l[i + a], e, a), c === S && (c = this._$AH[a]), n || (n = !R(c) || c !== this._$AH[a]), c === h ? t = h : t !== h && (t += (c ?? "") + o[a + 1]), this._$AH[a] = c;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class It extends F {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class Lt extends F {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class jt extends F {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = k(this, t, e, 0) ?? h) === S) return;
    const i = this._$AH, r = t === h && i !== h || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== h && (i === h || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Bt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    k(this, t);
  }
}
const Ft = T.litHtmlPolyfillSupport;
Ft?.(U, z), (T.litHtmlVersions ?? (T.litHtmlVersions = [])).push("3.3.3");
const Vt = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new z(t.insertBefore(H(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Vt(e, this.renderRoot, this.renderOptions);
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
const Wt = O.litElementPolyfillSupport;
Wt?.({ LitElement: M });
(O.litElementVersions ?? (O.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const qt = { attribute: !0, type: String, converter: j, reflect: !1, hasChanged: X }, Zt = (s = qt, t, e) => {
  const { kind: i, metadata: r } = e;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), o.set(e.name, s), i === "accessor") {
    const { name: n } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(n, a, s, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, s, l), l;
    } };
  }
  if (i === "setter") {
    const { name: n } = e;
    return function(l) {
      const a = this[n];
      t.call(this, l), this.requestUpdate(n, a, s, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function D(s) {
  return (t, e) => typeof e == "object" ? Zt(s, t, e) : ((i, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function m(s) {
  return D({ ...s, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Xt = (s, t, e) => (e.configurable = !0, e.enumerable = !0, Reflect.decorate && typeof t != "object" && Object.defineProperty(s, t, e), e);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Gt(s, t) {
  return (e, i, r) => {
    const o = (n) => n.renderRoot?.querySelector(s) ?? null;
    return Xt(e, i, { get() {
      return o(this);
    } });
  };
}
const Kt = "s3_files";
async function C(s, t, e = {}) {
  const r = (await s.callService(
    Kt,
    t,
    e,
    void 0,
    // Let the caller deal with failures: the panel shows them in place, which
    // is where the user is looking, rather than as a toast.
    !1,
    !0
  ))?.response;
  if (r == null)
    throw new Error(
      `s3_files.${t} did not return a response. If this integration was just updated, reload the page.`
    );
  return r;
}
async function Jt(s) {
  return C(s, "get_info");
}
async function Qt(s, t) {
  return (await C(s, "list_files", { path: t })).files ?? [];
}
async function Yt(s, t) {
  const e = await C(s, "read_file", { path: t });
  return String(e.content ?? "");
}
async function te(s, t, e, i = !0) {
  const r = await C(
    s,
    "write_file",
    { path: t, content: e, overwrite: i }
  );
  return {
    path: String(r.path ?? t),
    size: Number(r.size ?? 0)
  };
}
async function ee(s, t) {
  await C(s, "delete_file", { path: t });
}
async function ie(s, t, e, i = !1) {
  const r = await C(s, "move_file", {
    source: t,
    destination: e,
    overwrite: i
  });
  return String(r.path ?? e);
}
const se = /* @__PURE__ */ new Set([
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
]), re = {
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
function K(s) {
  const t = gt(s), e = t.lastIndexOf(".");
  return e <= 0 ? "" : t.slice(e + 1).toLowerCase();
}
function gt(s) {
  const t = (s ?? "").replace(/\/+$/, ""), e = t.lastIndexOf("/");
  return e === -1 ? t : t.slice(e + 1);
}
function J(s, t) {
  const e = (s ?? "").replace(/^\/+|\/+$/g, ""), i = (t ?? "").replace(/^\/+/g, "");
  return e ? i ? `${e}/${i}` : e : i;
}
function W(s) {
  const t = (s ?? "").replace(/\/+$/g, ""), e = t.lastIndexOf("/");
  return e === -1 ? "" : t.slice(0, e);
}
function oe(s, t = "Files") {
  const e = [{ label: t, path: "" }];
  let i = "";
  for (const r of (s ?? "").split("/").filter(Boolean))
    i = J(i, r), e.push({ label: r, path: i });
  return e;
}
function ne(s) {
  if (s == null) return "";
  if (s < 1024) return `${s} B`;
  const t = ["KB", "MB", "GB", "TB"];
  let e = s / 1024, i = 0;
  for (; e >= 1024 && i < t.length - 1; )
    e /= 1024, i += 1;
  return `${e < 10 ? e.toFixed(1) : Math.round(e)} ${t[i]}`;
}
function ae(s) {
  const t = K(s);
  return t === "" || se.has(t);
}
function le(s) {
  return s.is_folder ? "mdi:folder-outline" : re[K(s.path)] ?? "mdi:file-outline";
}
function $t(s) {
  const t = s.lastIndexOf(".");
  return t <= 0 ? s : s.slice(0, t);
}
function he(s, t = !0) {
  return s.is_folder || t ? s.name : $t(s.name);
}
function de(s, t = !0) {
  if (!t) return "";
  if (s.is_folder) return "Folder";
  const e = [];
  return s.size !== null && s.size !== void 0 && e.push(ne(s.size)), s.last_modified && e.push(s.last_modified.slice(0, 10)), e.join(" · ");
}
function vt(s, t = "md") {
  const e = (s ?? "").trim().replace(/\.+$/, "");
  return e ? /\.[A-Za-z0-9]+$/.test(e) ? e : `${e}.${t}` : "";
}
function ce(s, t) {
  const e = vt(t, K(s) || "md");
  return e ? J(W(s), e) : s;
}
const dt = {
  bold: ["**", "**"],
  italic: ["_", "_"],
  code: ["`", "`"]
}, ct = {
  heading: "## ",
  bullet: "- ",
  quote: "> "
};
function pe(s, t, e, i) {
  const r = Math.max(0, Math.min(e, t.length)), o = Math.max(r, Math.min(i, t.length)), n = t.slice(0, r), l = t.slice(r, o), a = t.slice(o);
  if (s === "link") {
    const p = `[${l || "text"}](url)`;
    return {
      text: n + p + a,
      selectionStart: r + p.length - 4,
      selectionEnd: r + p.length - 1
    };
  }
  if (s in dt) {
    const [c, p] = dt[s], u = `${c}${l}${p}`;
    return {
      text: n + u + a,
      selectionStart: r + c.length,
      selectionEnd: r + c.length + l.length
    };
  }
  if (s in ct) {
    const c = ct[s], p = n.lastIndexOf(`
`) + 1, g = t.slice(p, o).split(`
`).map(
      ($) => $.startsWith(c) ? $.slice(c.length) : `${c}${$}`
    ).join(`
`);
    return {
      text: t.slice(0, p) + g + a,
      selectionStart: p,
      selectionEnd: p + g.length
    };
  }
  return { text: t, selectionStart: r, selectionEnd: o };
}
function ue(s) {
  return [...s].sort((t, e) => t.is_folder !== e.is_folder ? t.is_folder ? -1 : 1 : t.path.localeCompare(e.path, void 0, { sensitivity: "base" }));
}
var _e = Object.defineProperty, f = (s, t, e, i) => {
  for (var r = void 0, o = s.length - 1, n; o >= 0; o--)
    (n = s[o]) && (r = n(t, e, r) || r);
  return r && _e(t, e, r), r;
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
      this._info = await Jt(this.hass), await this._load(this._path);
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
      this._path = t, this._entries = ue(await Qt(this.hass, t));
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
    if (this._editorOpen = !0, this._editorIsNew = !1, this._editorError = "", this._editorPreview = !1, this._editorName = t.path, this._editorContent = "", !ae(t.path)) {
      this._editorError = "This does not look like a text file. Editing it here is not supported.";
      return;
    }
    try {
      this._editorContent = await Yt(this.hass, t.path);
    } catch (e) {
      this._editorError = A(e);
    }
  }
  _openNew() {
    this._editorOpen = !0, this._editorIsNew = !0, this._editorError = "", this._editorPreview = !1, this._editorName = "", this._editorContent = "";
  }
  /** The path this file will be saved to. */
  get _targetPath() {
    return this._editorIsNew ? J(this._path, vt(this._editorName)) : this._editorName;
  }
  async _save() {
    if (this._editorIsNew && !this._editorName.trim()) {
      this._editorError = "Give the file a name.";
      return;
    }
    const t = this._targetPath;
    this._saving = !0, this._editorError = "";
    try {
      const e = await te(this.hass, t, this._editorContent, !0);
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
        await ee(this.hass, t.path), await this._load(this._path);
      } catch (e) {
        this._error = A(e);
      }
    }
  }
  async _applyFormat(t) {
    const e = this._contentArea;
    if (!e) return;
    const i = pe(
      t,
      this._editorContent,
      e.selectionStart,
      e.selectionEnd
    );
    this._editorContent = i.text, await this.updateComplete, e.focus(), e.setSelectionRange(i.selectionStart, i.selectionEnd);
  }
  _rowMenuItems(t) {
    const e = [];
    return this._permissions.allow_read && e.push({
      label: "Open",
      path: wt,
      action: () => void this._openExisting(t)
    }), this._permissions.allow_move && !t.is_folder && e.push({
      label: "Rename",
      path: yt,
      action: () => this._openRename(t)
    }), this._permissions.allow_delete && !t.is_folder && e.push({
      label: "Delete",
      path: bt,
      action: () => this._deleteTarget = t,
      warning: !0
    }), e;
  }
  _openRename(t) {
    this._renameTarget = t, this._renameError = "", this._renaming = !1, this._renameName = $t(gt(t.path));
  }
  /** Where the renamed file will land. */
  get _renameDestination() {
    return this._renameTarget ? ce(this._renameTarget.path, this._renameName) : "";
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
      await ie(this.hass, t.path, e, !1), this._renameTarget = null, await this._load(this._path);
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
    const t = oe(this._path, this._rootLabel);
    return d`
      <nav>
        ${t.map((e, i) => {
      const r = i === t.length - 1;
      return d`${i > 0 ? d`<span class="sep">/</span>` : h}
            <button
              class=${r ? "current" : ""}
              ?disabled=${r}
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
    const e = t.is_folder || this._permissions.allow_read, i = this._showDetails ? de(t, !0) : "", r = this._rowMenuItems(t);
    return d`
      <div class="row" data-clickable=${e}>
        <ha-icon
          .icon=${le(t)}
          @click=${() => this._activate(t)}
        ></ha-icon>
        <div class="row-text" @click=${() => this._activate(t)}>
          <div class="row-title">${he(t, this._showDetails)}</div>
          ${i ? d`<div class="row-meta">${i}</div>` : h}
        </div>
        ${r.length ? d`<ha-icon-overflow-menu
              .narrow=${!0}
              .items=${r}
            ></ha-icon-overflow-menu>` : h}
      </div>
    `;
  }
  _editorHeading() {
    return this._editorIsNew ? "New file" : this._permissions.allow_read ? "Edit file" : "File";
  }
  _renderMarkdownBar() {
    const t = (e, i, r) => d`<button title=${r} @click=${() => void this._applyFormat(i)}>
        ${e}
      </button>`;
    return d`
      <div class="markdown-bar">
        ${t("B", "bold", "Bold")} ${t("I", "italic", "Italic")}
        ${t("##", "heading", "Heading")}
        ${t("•", "bullet", "Bullet list")}
        ${t("❝", "quote", "Quote")} ${t("</>", "code", "Code")}
        ${t("Link", "link", "Link")}
        <span class="spacer"></span>
        <button
          data-active=${this._editorPreview}
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
          ${t ? this._renderMarkdownBar() : h}
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
          <ha-button slot="primaryAction" @click=${this._delete}>
            Delete
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
};
Q.styles = At`
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
let _ = Q;
f([
  D({ attribute: !1 })
], _.prototype, "hass");
f([
  D({ type: Boolean })
], _.prototype, "narrow");
f([
  D({ attribute: !1 })
], _.prototype, "route");
f([
  D({ attribute: !1 })
], _.prototype, "panel");
f([
  m()
], _.prototype, "_info");
f([
  m()
], _.prototype, "_path");
f([
  m()
], _.prototype, "_entries");
f([
  m()
], _.prototype, "_loading");
f([
  m()
], _.prototype, "_error");
f([
  m()
], _.prototype, "_editorOpen");
f([
  m()
], _.prototype, "_editorIsNew");
f([
  m()
], _.prototype, "_editorName");
f([
  m()
], _.prototype, "_editorContent");
f([
  m()
], _.prototype, "_editorPreview");
f([
  m()
], _.prototype, "_editorError");
f([
  m()
], _.prototype, "_saving");
f([
  m()
], _.prototype, "_deleteTarget");
f([
  m()
], _.prototype, "_renameTarget");
f([
  m()
], _.prototype, "_renameName");
f([
  m()
], _.prototype, "_renameError");
f([
  m()
], _.prototype, "_renaming");
f([
  Gt("textarea.markdown")
], _.prototype, "_contentArea");
function A(s) {
  return s instanceof Error ? s.message : String(s);
}
customElements.get("s3-files-panel") || customElements.define("s3-files-panel", _);
export {
  _ as S3FilesPanel
};
