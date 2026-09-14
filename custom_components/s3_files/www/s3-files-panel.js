var mt = "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z", $t = "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const D = globalThis, q = D.ShadowRoot && (D.ShadyCSS === void 0 || D.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), G = /* @__PURE__ */ new WeakMap();
let ht = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (q && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = G.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && G.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const gt = (s) => new ht(typeof s == "string" ? s : s + "", void 0, V), vt = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new ht(e, s, V);
}, bt = (s, t) => {
  if (q) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = D.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, J = q ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return gt(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: wt, defineProperty: yt, getOwnPropertyDescriptor: xt, getOwnPropertyNames: At, getOwnPropertySymbols: Et, getPrototypeOf: St } = Object, b = globalThis, Q = b.trustedTypes, kt = Q ? Q.emptyScript : "", Ct = b.reactiveElementPolyfillSupport, P = (s, t) => s, L = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? kt : null;
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
} }, Z = (s, t) => !wt(s, t), Y = { attribute: !0, type: String, converter: L, reflect: !1, useDefault: !1, hasChanged: Z };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), b.litPropertyMetadata ?? (b.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let A = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Y) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && yt(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = xt(this.prototype, t) ?? { get() {
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
    return this.elementProperties.get(t) ?? Y;
  }
  static _$Ei() {
    if (this.hasOwnProperty(P("elementProperties"))) return;
    const t = St(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const e = this.properties, i = [...At(e), ...Et(e)];
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
      for (const r of i) e.unshift(J(r));
    } else t !== void 0 && e.push(J(t));
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
    return bt(t, this.constructor.elementStyles), t;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : L).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = i.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : L;
      this._$Em = r;
      const l = n.fromAttribute(e, o.type);
      this[r] = l ?? this._$Ej?.get(r) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[t]), i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? Z)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
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
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[P("elementProperties")] = /* @__PURE__ */ new Map(), A[P("finalized")] = /* @__PURE__ */ new Map(), Ct?.({ ReactiveElement: A }), (b.reactiveElementVersions ?? (b.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, tt = (s) => s, B = N.trustedTypes, et = B ? B.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, dt = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ct = "?" + v, Pt = `<${ct}>`, x = document, T = () => x.createComment(""), H = (s) => s === null || typeof s != "object" && typeof s != "function", X = Array.isArray, Nt = (s) => X(s) || typeof s?.[Symbol.iterator] == "function", W = `[ 	
\f\r]`, k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, it = /-->/g, st = />/g, w = RegExp(`>|${W}(?:([^\\s"'>=/]+)(${W}*=${W}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), rt = /'/g, ot = /"/g, pt = /^(?:script|style|textarea|title)$/i, Ot = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), u = Ot(1), E = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), nt = /* @__PURE__ */ new WeakMap(), y = x.createTreeWalker(x, 129);
function ut(s, t) {
  if (!X(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return et !== void 0 ? et.createHTML(t) : t;
}
const Mt = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = k;
  for (let l = 0; l < e; l++) {
    const a = s[l];
    let d, c, p = -1, $ = 0;
    for (; $ < a.length && (n.lastIndex = $, c = n.exec(a), c !== null); ) $ = n.lastIndex, n === k ? c[1] === "!--" ? n = it : c[1] !== void 0 ? n = st : c[2] !== void 0 ? (pt.test(c[2]) && (r = RegExp("</" + c[2], "g")), n = w) : c[3] !== void 0 && (n = w) : n === w ? c[0] === ">" ? (n = r ?? k, p = -1) : c[1] === void 0 ? p = -2 : (p = n.lastIndex - c[2].length, d = c[1], n = c[3] === void 0 ? w : c[3] === '"' ? ot : rt) : n === ot || n === rt ? n = w : n === it || n === st ? n = k : (n = w, r = void 0);
    const g = n === w && s[l + 1].startsWith("/>") ? " " : "";
    o += n === k ? a + Pt : p >= 0 ? (i.push(d), a.slice(0, p) + dt + a.slice(p) + v + g) : a + v + (p === -2 ? l : g);
  }
  return [ut(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class U {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [d, c] = Mt(t, e);
    if (this.el = U.createElement(d, i), y.currentNode = this.el.content, e === 2 || e === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (r = y.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const p of r.getAttributeNames()) if (p.endsWith(dt)) {
          const $ = c[n++], g = r.getAttribute(p).split(v), j = /([.?@])?(.*)/.exec($);
          a.push({ type: 1, index: o, name: j[2], strings: g, ctor: j[1] === "." ? Ht : j[1] === "?" ? Ut : j[1] === "@" ? zt : F }), r.removeAttribute(p);
        } else p.startsWith(v) && (a.push({ type: 6, index: o }), r.removeAttribute(p));
        if (pt.test(r.tagName)) {
          const p = r.textContent.split(v), $ = p.length - 1;
          if ($ > 0) {
            r.textContent = B ? B.emptyScript : "";
            for (let g = 0; g < $; g++) r.append(p[g], T()), y.nextNode(), a.push({ type: 2, index: ++o });
            r.append(p[$], T());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ct) a.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = r.data.indexOf(v, p + 1)) !== -1; ) a.push({ type: 7, index: o }), p += v.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = x.createElement("template");
    return i.innerHTML = t, i;
  }
}
function S(s, t, e = s, i) {
  if (t === E) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = H(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = r : e._$Cl = r), r !== void 0 && (t = S(s, r._$AS(s, t.values), r, i)), t;
}
class Tt {
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
        let d;
        a.type === 2 ? d = new z(o, o.nextSibling, this, t) : a.type === 1 ? d = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (d = new Rt(o, this, t)), this._$AV.push(d), a = i[++l];
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
    t = S(this, t, e), H(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Nt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && H(this._$AH) ? this._$AA.nextSibling.data = t : this.T(x.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = U.createElement(ut(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const o = new Tt(r, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = nt.get(t.strings);
    return e === void 0 && nt.set(t.strings, e = new U(t)), e;
  }
  k(t) {
    X(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new z(this.O(T()), this.O(T()), this, this.options)) : i = e[r], i._$AI(o), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = tt(t).nextSibling;
      tt(t).remove(), t = i;
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
    if (o === void 0) t = S(this, t, e, 0), n = !H(t) || t !== this._$AH && t !== E, n && (this._$AH = t);
    else {
      const l = t;
      let a, d;
      for (t = o[0], a = 0; a < o.length - 1; a++) d = S(this, l[i + a], e, a), d === E && (d = this._$AH[a]), n || (n = !H(d) || d !== this._$AH[a]), d === h ? t = h : t !== h && (t += (d ?? "") + o[a + 1]), this._$AH[a] = d;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Ht extends F {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class Ut extends F {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class zt extends F {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = S(this, t, e, 0) ?? h) === E) return;
    const i = this._$AH, r = t === h && i !== h || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== h && (i === h || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Rt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    S(this, t);
  }
}
const It = N.litHtmlPolyfillSupport;
It?.(U, z), (N.litHtmlVersions ?? (N.litHtmlVersions = [])).push("3.3.3");
const jt = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new z(t.insertBefore(T(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const O = globalThis;
class M extends A {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = jt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return E;
  }
}
M._$litElement$ = !0, M.finalized = !0, O.litElementHydrateSupport?.({ LitElement: M });
const Dt = O.litElementPolyfillSupport;
Dt?.({ LitElement: M });
(O.litElementVersions ?? (O.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Lt = { attribute: !0, type: String, converter: L, reflect: !1, hasChanged: Z }, Bt = (s = Lt, t, e) => {
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
function R(s) {
  return (t, e) => typeof e == "object" ? Bt(s, t, e) : ((i, r, o) => {
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
  return R({ ...s, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ft = (s, t, e) => (e.configurable = !0, e.enumerable = !0, Reflect.decorate && typeof t != "object" && Object.defineProperty(s, t, e), e);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Wt(s, t) {
  return (e, i, r) => {
    const o = (n) => n.renderRoot?.querySelector(s) ?? null;
    return Ft(e, i, { get() {
      return o(this);
    } });
  };
}
const qt = "s3_files";
async function I(s, t, e = {}) {
  const r = (await s.callService(
    qt,
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
async function Vt(s) {
  return I(s, "get_info");
}
async function Zt(s, t) {
  return (await I(s, "list_files", { path: t })).files ?? [];
}
async function Xt(s, t) {
  const e = await I(s, "read_file", { path: t });
  return String(e.content ?? "");
}
async function Kt(s, t, e, i = !0) {
  const r = await I(
    s,
    "write_file",
    { path: t, content: e, overwrite: i }
  );
  return {
    path: String(r.path ?? t),
    size: Number(r.size ?? 0)
  };
}
async function Gt(s, t) {
  await I(s, "delete_file", { path: t });
}
const Jt = /* @__PURE__ */ new Set([
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
]), Qt = {
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
function ft(s) {
  const t = Yt(s), e = t.lastIndexOf(".");
  return e <= 0 ? "" : t.slice(e + 1).toLowerCase();
}
function Yt(s) {
  const t = (s ?? "").replace(/\/+$/, ""), e = t.lastIndexOf("/");
  return e === -1 ? t : t.slice(e + 1);
}
function _t(s, t) {
  const e = (s ?? "").replace(/^\/+|\/+$/g, ""), i = (t ?? "").replace(/^\/+/g, "");
  return e ? i ? `${e}/${i}` : e : i;
}
function te(s) {
  const t = (s ?? "").replace(/\/+$/g, ""), e = t.lastIndexOf("/");
  return e === -1 ? "" : t.slice(0, e);
}
function ee(s, t = "Files") {
  const e = [{ label: t, path: "" }];
  let i = "";
  for (const r of (s ?? "").split("/").filter(Boolean))
    i = _t(i, r), e.push({ label: r, path: i });
  return e;
}
function ie(s) {
  if (s == null) return "";
  if (s < 1024) return `${s} B`;
  const t = ["KB", "MB", "GB", "TB"];
  let e = s / 1024, i = 0;
  for (; e >= 1024 && i < t.length - 1; )
    e /= 1024, i += 1;
  return `${e < 10 ? e.toFixed(1) : Math.round(e)} ${t[i]}`;
}
function se(s) {
  const t = ft(s);
  return t === "" || Jt.has(t);
}
function re(s) {
  return s.is_folder ? "mdi:folder-outline" : Qt[ft(s.path)] ?? "mdi:file-outline";
}
function oe(s) {
  const t = s.lastIndexOf(".");
  return t <= 0 ? s : s.slice(0, t);
}
function ne(s, t = !0) {
  return s.is_folder || t ? s.name : oe(s.name);
}
function ae(s, t = !0) {
  if (!t) return "";
  if (s.is_folder) return "Folder";
  const e = [];
  return s.size !== null && s.size !== void 0 && e.push(ie(s.size)), s.last_modified && e.push(s.last_modified.slice(0, 10)), e.join(" · ");
}
function le(s, t = "md") {
  const e = (s ?? "").trim().replace(/\.+$/, "");
  return e ? /\.[A-Za-z0-9]+$/.test(e) ? e : `${e}.${t}` : "";
}
const at = {
  bold: ["**", "**"],
  italic: ["_", "_"],
  code: ["`", "`"]
}, lt = {
  heading: "## ",
  bullet: "- ",
  quote: "> "
};
function he(s, t, e, i) {
  const r = Math.max(0, Math.min(e, t.length)), o = Math.max(r, Math.min(i, t.length)), n = t.slice(0, r), l = t.slice(r, o), a = t.slice(o);
  if (s === "link") {
    const c = `[${l || "text"}](url)`;
    return {
      text: n + c + a,
      selectionStart: r + c.length - 4,
      selectionEnd: r + c.length - 1
    };
  }
  if (s in at) {
    const [d, c] = at[s], p = `${d}${l}${c}`;
    return {
      text: n + p + a,
      selectionStart: r + d.length,
      selectionEnd: r + d.length + l.length
    };
  }
  if (s in lt) {
    const d = lt[s], c = n.lastIndexOf(`
`) + 1, $ = t.slice(c, o).split(`
`).map(
      (g) => g.startsWith(d) ? g.slice(d.length) : `${d}${g}`
    ).join(`
`);
    return {
      text: t.slice(0, c) + $ + a,
      selectionStart: c,
      selectionEnd: c + $.length
    };
  }
  return { text: t, selectionStart: r, selectionEnd: o };
}
function de(s) {
  return [...s].sort((t, e) => t.is_folder !== e.is_folder ? t.is_folder ? -1 : 1 : t.path.localeCompare(e.path, void 0, { sensitivity: "base" }));
}
var ce = Object.defineProperty, _ = (s, t, e, i) => {
  for (var r = void 0, o = s.length - 1, n; o >= 0; o--)
    (n = s[o]) && (r = n(t, e, r) || r);
  return r && ce(t, e, r), r;
};
const K = class K extends M {
  constructor() {
    super(...arguments), this.narrow = !1, this._info = null, this._path = "", this._entries = [], this._loading = !1, this._error = "", this._editorOpen = !1, this._editorIsNew = !1, this._editorName = "", this._editorContent = "", this._editorPreview = !1, this._editorError = "", this._saving = !1, this._deleteTarget = null;
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
      this._info = await Vt(this.hass), await this._load(this._path);
    } catch (t) {
      this._error = C(t);
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
      this._path = t, this._entries = de(await Zt(this.hass, t));
    } catch (e) {
      this._error = C(e), this._entries = [];
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
    if (this._editorOpen = !0, this._editorIsNew = !1, this._editorError = "", this._editorPreview = !1, this._editorName = t.path, this._editorContent = "", !se(t.path)) {
      this._editorError = "This does not look like a text file. Editing it here is not supported.";
      return;
    }
    try {
      this._editorContent = await Xt(this.hass, t.path);
    } catch (e) {
      this._editorError = C(e);
    }
  }
  _openNew() {
    this._editorOpen = !0, this._editorIsNew = !0, this._editorError = "", this._editorPreview = !1, this._editorName = "", this._editorContent = "";
  }
  /** The path this file will be saved to. */
  get _targetPath() {
    return this._editorIsNew ? _t(this._path, le(this._editorName)) : this._editorName;
  }
  async _save() {
    if (this._editorIsNew && !this._editorName.trim()) {
      this._editorError = "Give the file a name.";
      return;
    }
    const t = this._targetPath;
    this._saving = !0, this._editorError = "";
    try {
      const e = await Kt(this.hass, t, this._editorContent, !0);
      this._editorOpen = !1, await this._load(te(e.path));
    } catch (e) {
      this._editorError = C(e);
    } finally {
      this._saving = !1;
    }
  }
  async _delete() {
    const t = this._deleteTarget;
    if (t) {
      this._deleteTarget = null;
      try {
        await Gt(this.hass, t.path), await this._load(this._path);
      } catch (e) {
        this._error = C(e);
      }
    }
  }
  async _applyFormat(t) {
    const e = this._contentArea;
    if (!e) return;
    const i = he(
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
      path: $t,
      action: () => void this._openExisting(t)
    }), this._permissions.allow_delete && !t.is_folder && e.push({
      label: "Delete",
      path: mt,
      action: () => this._deleteTarget = t,
      warning: !0
    }), e;
  }
  render() {
    return this.hass ? u`
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
            ${this._permissions.allow_write ? u`<ha-button @click=${this._openNew}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  <span class="new-label">New file</span>
                </ha-button>` : h}
          </div>
        </div>

        ${this._permissions.allow_list ? this._renderBreadcrumbs() : h}
        ${this._error ? u`<div class="error">${this._error}</div>` : h}
        ${this._renderList()}
      </div>

      ${this._renderEditor()} ${this._renderDeleteDialog()}
    ` : u``;
  }
  _subtitle() {
    return this._info ? `in ${this._info.scope ? this._info.scope : "the whole bucket"} of ${this._info.bucket}` : "";
  }
  _renderBreadcrumbs() {
    const t = ee(this._path, this._rootLabel);
    return u`
      <nav>
        ${t.map((e, i) => {
      const r = i === t.length - 1;
      return u`${i > 0 ? u`<span class="sep">/</span>` : h}
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
    return this._permissions.allow_list ? this._loading && this._entries.length === 0 ? u`<div class="list">
        <div class="empty">Loading…</div>
      </div>` : this._entries.length === 0 && !this._error ? u`<div class="list">
        <div class="empty">Nothing here yet.</div>
      </div>` : u`<div class="list">
      ${this._entries.map((t) => this._renderRow(t))}
    </div>` : u`<div class="list">
        <div class="empty">
          Listing is switched off for this integration. Turn on "List files and
          folders" in its options to browse them here.
        </div>
      </div>`;
  }
  _renderRow(t) {
    const e = t.is_folder || this._permissions.allow_read, i = this._showDetails ? ae(t, !0) : "", r = this._rowMenuItems(t);
    return u`
      <div class="row" data-clickable=${e}>
        <ha-icon
          .icon=${re(t)}
          @click=${() => this._activate(t)}
        ></ha-icon>
        <div class="row-text" @click=${() => this._activate(t)}>
          <div class="row-title">${ne(t, this._showDetails)}</div>
          ${i ? u`<div class="row-meta">${i}</div>` : h}
        </div>
        ${r.length ? u`<ha-icon-overflow-menu
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
    const t = (e, i, r) => u`<button title=${r} @click=${() => void this._applyFormat(i)}>
        ${e}
      </button>`;
    return u`
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
    return u`
      <ha-dialog
        .open=${this._editorOpen}
        .heading=${this._editorHeading()}
        @closed=${() => this._editorOpen = !1}
      >
        <div class="editor">
          ${this._editorIsNew ? u`<div class="field">
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
              </div>` : u`<div class="field">
                <label>File</label>
                <div class="where">${this._editorName}</div>
              </div>`}
          ${t ? this._renderMarkdownBar() : h}
          ${this._editorPreview ? u`<div class="preview">
                <ha-markdown .content=${this._editorContent}></ha-markdown>
              </div>` : u`<textarea
                class="markdown"
                .value=${this._editorContent}
                placeholder="Write your note…"
                ?disabled=${!t}
                @input=${(e) => {
      this._editorContent = e.target.value;
    }}
              ></textarea>`}
          ${this._editorError ? u`<div class="error">${this._editorError}</div>` : h}
          ${t ? h : u`<div class="hint">
                Writing is switched off for this integration, so this file cannot
                be saved from here.
              </div>`}
        </div>

        <ha-dialog-footer slot="footer">
          ${this._permissions.allow_delete && !this._editorIsNew ? u`<ha-button
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
          ${t ? u`<ha-button
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
  _renderDeleteDialog() {
    const t = this._deleteTarget;
    return u`
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
K.styles = vt`
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
let f = K;
_([
  R({ attribute: !1 })
], f.prototype, "hass");
_([
  R({ type: Boolean })
], f.prototype, "narrow");
_([
  R({ attribute: !1 })
], f.prototype, "route");
_([
  R({ attribute: !1 })
], f.prototype, "panel");
_([
  m()
], f.prototype, "_info");
_([
  m()
], f.prototype, "_path");
_([
  m()
], f.prototype, "_entries");
_([
  m()
], f.prototype, "_loading");
_([
  m()
], f.prototype, "_error");
_([
  m()
], f.prototype, "_editorOpen");
_([
  m()
], f.prototype, "_editorIsNew");
_([
  m()
], f.prototype, "_editorName");
_([
  m()
], f.prototype, "_editorContent");
_([
  m()
], f.prototype, "_editorPreview");
_([
  m()
], f.prototype, "_editorError");
_([
  m()
], f.prototype, "_saving");
_([
  m()
], f.prototype, "_deleteTarget");
_([
  Wt("textarea.markdown")
], f.prototype, "_contentArea");
function C(s) {
  return s instanceof Error ? s.message : String(s);
}
customElements.get("s3-files-panel") || customElements.define("s3-files-panel", f);
export {
  f as S3FilesPanel
};
