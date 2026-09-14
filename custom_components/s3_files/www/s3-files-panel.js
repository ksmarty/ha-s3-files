/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const I = globalThis, W = I.ShadowRoot && (I.ShadyCSS === void 0 || I.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), G = /* @__PURE__ */ new WeakMap();
let at = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (W && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = G.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && G.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const ft = (s) => new at(typeof s == "string" ? s : s + "", void 0, V), _t = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new at(e, s, V);
}, $t = (s, t) => {
  if (W) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = I.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, J = W ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return ft(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: mt, defineProperty: gt, getOwnPropertyDescriptor: vt, getOwnPropertyNames: yt, getOwnPropertySymbols: bt, getPrototypeOf: wt } = Object, y = globalThis, Q = y.trustedTypes, At = Q ? Q.emptyScript : "", xt = y.reactiveElementPolyfillSupport, P = (s, t) => s, L = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? At : null;
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
} }, K = (s, t) => !mt(s, t), Y = { attribute: !0, type: String, converter: L, reflect: !1, useDefault: !1, hasChanged: K };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), y.litPropertyMetadata ?? (y.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let x = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Y) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && gt(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = vt(this.prototype, t) ?? { get() {
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
    const t = wt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const e = this.properties, i = [...yt(e), ...bt(e)];
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
    return $t(t, this.constructor.elementStyles), t;
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
      if (r === !1 && (o = this[t]), i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? K)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
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
x.elementStyles = [], x.shadowRootOptions = { mode: "open" }, x[P("elementProperties")] = /* @__PURE__ */ new Map(), x[P("finalized")] = /* @__PURE__ */ new Map(), xt?.({ ReactiveElement: x }), (y.reactiveElementVersions ?? (y.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, tt = (s) => s, B = N.trustedTypes, et = B ? B.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, lt = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ht = "?" + v, Et = `<${ht}>`, A = document, U = () => A.createComment(""), M = (s) => s === null || typeof s != "object" && typeof s != "function", X = Array.isArray, St = (s) => X(s) || typeof s?.[Symbol.iterator] == "function", q = `[ 	
\f\r]`, C = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, it = /-->/g, st = />/g, b = RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), rt = /'/g, ot = /"/g, dt = /^(?:script|style|textarea|title)$/i, Ct = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), c = Ct(1), E = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), nt = /* @__PURE__ */ new WeakMap(), w = A.createTreeWalker(A, 129);
function ct(s, t) {
  if (!X(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return et !== void 0 ? et.createHTML(t) : t;
}
const Ot = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = C;
  for (let l = 0; l < e; l++) {
    const a = s[l];
    let p, f, d = -1, m = 0;
    for (; m < a.length && (n.lastIndex = m, f = n.exec(a), f !== null); ) m = n.lastIndex, n === C ? f[1] === "!--" ? n = it : f[1] !== void 0 ? n = st : f[2] !== void 0 ? (dt.test(f[2]) && (r = RegExp("</" + f[2], "g")), n = b) : f[3] !== void 0 && (n = b) : n === b ? f[0] === ">" ? (n = r ?? C, d = -1) : f[1] === void 0 ? d = -2 : (d = n.lastIndex - f[2].length, p = f[1], n = f[3] === void 0 ? b : f[3] === '"' ? ot : rt) : n === ot || n === rt ? n = b : n === it || n === st ? n = C : (n = b, r = void 0);
    const g = n === b && s[l + 1].startsWith("/>") ? " " : "";
    o += n === C ? a + Et : d >= 0 ? (i.push(p), a.slice(0, d) + lt + a.slice(d) + v + g) : a + v + (d === -2 ? l : g);
  }
  return [ct(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class D {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [p, f] = Ot(t, e);
    if (this.el = D.createElement(p, i), w.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (r = w.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const d of r.getAttributeNames()) if (d.endsWith(lt)) {
          const m = f[n++], g = r.getAttribute(d).split(v), j = /([.?@])?(.*)/.exec(m);
          a.push({ type: 1, index: o, name: j[2], strings: g, ctor: j[1] === "." ? Nt : j[1] === "?" ? kt : j[1] === "@" ? Tt : F }), r.removeAttribute(d);
        } else d.startsWith(v) && (a.push({ type: 6, index: o }), r.removeAttribute(d));
        if (dt.test(r.tagName)) {
          const d = r.textContent.split(v), m = d.length - 1;
          if (m > 0) {
            r.textContent = B ? B.emptyScript : "";
            for (let g = 0; g < m; g++) r.append(d[g], U()), w.nextNode(), a.push({ type: 2, index: ++o });
            r.append(d[m], U());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ht) a.push({ type: 2, index: o });
      else {
        let d = -1;
        for (; (d = r.data.indexOf(v, d + 1)) !== -1; ) a.push({ type: 7, index: o }), d += v.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = A.createElement("template");
    return i.innerHTML = t, i;
  }
}
function S(s, t, e = s, i) {
  if (t === E) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = M(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = r : e._$Cl = r), r !== void 0 && (t = S(s, r._$AS(s, t.values), r, i)), t;
}
class Pt {
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
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? A).importNode(e, !0);
    w.currentNode = r;
    let o = w.nextNode(), n = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let p;
        a.type === 2 ? p = new H(o, o.nextSibling, this, t) : a.type === 1 ? p = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (p = new Ut(o, this, t)), this._$AV.push(p), a = i[++l];
      }
      n !== a?.index && (o = w.nextNode(), n++);
    }
    return w.currentNode = A, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class H {
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
    t = S(this, t, e), M(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : St(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && M(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = D.createElement(ct(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const o = new Pt(r, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = nt.get(t.strings);
    return e === void 0 && nt.set(t.strings, e = new D(t)), e;
  }
  k(t) {
    X(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new H(this.O(U()), this.O(U()), this, this.options)) : i = e[r], i._$AI(o), r++;
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
    if (o === void 0) t = S(this, t, e, 0), n = !M(t) || t !== this._$AH && t !== E, n && (this._$AH = t);
    else {
      const l = t;
      let a, p;
      for (t = o[0], a = 0; a < o.length - 1; a++) p = S(this, l[i + a], e, a), p === E && (p = this._$AH[a]), n || (n = !M(p) || p !== this._$AH[a]), p === h ? t = h : t !== h && (t += (p ?? "") + o[a + 1]), this._$AH[a] = p;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Nt extends F {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class kt extends F {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class Tt extends F {
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
class Ut {
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
const Mt = N.litHtmlPolyfillSupport;
Mt?.(D, H), (N.litHtmlVersions ?? (N.litHtmlVersions = [])).push("3.3.3");
const Dt = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new H(t.insertBefore(U(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = globalThis;
class T extends x {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Dt(e, this.renderRoot, this.renderOptions);
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
T._$litElement$ = !0, T.finalized = !0, k.litElementHydrateSupport?.({ LitElement: T });
const Ht = k.litElementPolyfillSupport;
Ht?.({ LitElement: T });
(k.litElementVersions ?? (k.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const zt = { attribute: !0, type: String, converter: L, reflect: !1, hasChanged: K }, Rt = (s = zt, t, e) => {
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
function z(s) {
  return (t, e) => typeof e == "object" ? Rt(s, t, e) : ((i, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function $(s) {
  return z({ ...s, state: !0, attribute: !1 });
}
const jt = "s3_files";
async function R(s, t, e = {}) {
  const r = (await s.callService(
    jt,
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
async function It(s) {
  return R(s, "get_info");
}
async function Lt(s, t) {
  return (await R(s, "list_files", { path: t })).files ?? [];
}
async function Bt(s, t) {
  const e = await R(s, "read_file", { path: t });
  return String(e.content ?? "");
}
async function Ft(s, t, e, i = !0) {
  const r = await R(
    s,
    "write_file",
    { path: t, content: e, overwrite: i }
  );
  return {
    path: String(r.path ?? t),
    size: Number(r.size ?? 0)
  };
}
async function qt(s, t) {
  await R(s, "delete_file", { path: t });
}
const Wt = /* @__PURE__ */ new Set([
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
]), Vt = {
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
function pt(s) {
  const t = Kt(s), e = t.lastIndexOf(".");
  return e <= 0 ? "" : t.slice(e + 1).toLowerCase();
}
function Kt(s) {
  const t = (s ?? "").replace(/\/+$/, ""), e = t.lastIndexOf("/");
  return e === -1 ? t : t.slice(e + 1);
}
function ut(s, t) {
  const e = (s ?? "").replace(/^\/+|\/+$/g, ""), i = (t ?? "").replace(/^\/+/g, "");
  return e ? i ? `${e}/${i}` : e : i;
}
function Xt(s) {
  const t = (s ?? "").replace(/\/+$/g, ""), e = t.lastIndexOf("/");
  return e === -1 ? "" : t.slice(0, e);
}
function Zt(s, t = "Files") {
  const e = [{ label: t, path: "" }];
  let i = "";
  for (const r of (s ?? "").split("/").filter(Boolean))
    i = ut(i, r), e.push({ label: r, path: i });
  return e;
}
function Gt(s) {
  if (s == null) return "";
  if (s < 1024) return `${s} B`;
  const t = ["KB", "MB", "GB", "TB"];
  let e = s / 1024, i = 0;
  for (; e >= 1024 && i < t.length - 1; )
    e /= 1024, i += 1;
  return `${e < 10 ? e.toFixed(1) : Math.round(e)} ${t[i]}`;
}
function Jt(s) {
  const t = pt(s);
  return t === "" || Wt.has(t);
}
function Qt(s) {
  return s.is_folder ? "mdi:folder-outline" : Vt[pt(s.path)] ?? "mdi:file-outline";
}
function Yt(s) {
  if (s.is_folder) return "Folder";
  const t = [];
  return s.size !== null && s.size !== void 0 && t.push(Gt(s.size)), s.last_modified && t.push(s.last_modified.slice(0, 10)), t.join(" · ");
}
function te(s) {
  return [...s].sort((t, e) => t.is_folder !== e.is_folder ? t.is_folder ? -1 : 1 : t.path.localeCompare(e.path, void 0, { sensitivity: "base" }));
}
var ee = Object.defineProperty, _ = (s, t, e, i) => {
  for (var r = void 0, o = s.length - 1, n; o >= 0; o--)
    (n = s[o]) && (r = n(t, e, r) || r);
  return r && ee(t, e, r), r;
};
const Z = class Z extends T {
  constructor() {
    super(...arguments), this.narrow = !1, this._info = null, this._path = "", this._entries = [], this._loading = !1, this._error = "", this._editorOpen = !1, this._editorIsNew = !1, this._editorData = {}, this._editorError = "", this._saving = !1, this._deleteTarget = null;
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
  async _start() {
    this._loading = !0, this._error = "";
    try {
      this._info = await It(this.hass), await this._load(this._path);
    } catch (t) {
      this._error = O(t);
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
      this._path = t, this._entries = te(await Lt(this.hass, t));
    } catch (e) {
      this._error = O(e), this._entries = [];
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
    if (this._editorOpen = !0, this._editorIsNew = !1, this._editorError = "", this._editorData = { path: t.path, content: "" }, !Jt(t.path)) {
      this._editorError = "This does not look like a text file. Editing it here is not supported.";
      return;
    }
    try {
      const e = await Bt(this.hass, t.path);
      this._editorData = { path: t.path, content: e };
    } catch (e) {
      this._editorError = O(e);
    }
  }
  _openNew() {
    this._editorOpen = !0, this._editorIsNew = !0, this._editorError = "", this._editorData = { path: ut(this._path, ""), content: "" };
  }
  async _save() {
    const t = String(this._editorData.path ?? "").trim(), e = String(this._editorData.content ?? "");
    if (!t) {
      this._editorError = "Give the file a name.";
      return;
    }
    this._saving = !0, this._editorError = "";
    try {
      const i = await Ft(this.hass, t, e, !0);
      this._editorOpen = !1, await this._load(Xt(i.path));
    } catch (i) {
      this._editorError = O(i);
    } finally {
      this._saving = !1;
    }
  }
  async _delete() {
    const t = this._deleteTarget;
    if (t) {
      this._deleteTarget = null;
      try {
        await qt(this.hass, t.path), await this._load(this._path);
      } catch (e) {
        this._error = O(e);
      }
    }
  }
  _editorSchema() {
    const t = [];
    return this._editorIsNew && t.push({
      name: "path",
      required: !0,
      selector: { text: {} }
    }), t.push({
      name: "content",
      selector: { text: { multiline: !0 } }
    }), t;
  }
  _editorLabels() {
    return {
      path: "File name",
      content: "Contents"
    };
  }
  render() {
    return this.hass ? c`
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
            ${this._permissions.allow_write ? c`<ha-button @click=${this._openNew}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  <span class="new-label">New file</span>
                </ha-button>` : h}
          </div>
        </div>

        ${this._permissions.allow_list ? this._renderBreadcrumbs() : h}
        ${this._error ? c`<div class="error">${this._error}</div>` : h}
        ${this._renderList()}
      </div>

      ${this._renderEditor()} ${this._renderDeleteDialog()}
    ` : c``;
  }
  _subtitle() {
    return this._info ? `in ${this._info.scope ? this._info.scope : "the whole bucket"} of ${this._info.bucket}` : "";
  }
  _renderBreadcrumbs() {
    const t = Zt(this._path, this._rootLabel);
    return c`
      <nav>
        ${t.map((e, i) => {
      const r = i === t.length - 1;
      return c`${i > 0 ? c`<span class="sep">/</span>` : h}
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
    return this._permissions.allow_list ? this._loading && this._entries.length === 0 ? c`<div class="list">
        <div class="empty">Loading…</div>
      </div>` : this._entries.length === 0 && !this._error ? c`<div class="list">
        <div class="empty">Nothing here yet.</div>
      </div>` : c`<div class="list">
      ${this._entries.map((t) => this._renderRow(t))}
    </div>` : c`<div class="list">
        <div class="empty">
          Listing is switched off for this integration. Turn on "List files and
          folders" in its options to browse them here.
        </div>
      </div>`;
  }
  _renderRow(t) {
    const e = t.is_folder || this._permissions.allow_read;
    return c`
      <div class="row" data-clickable=${e}>
        <ha-icon
          .icon=${Qt(t)}
          @click=${() => this._activate(t)}
        ></ha-icon>
        <div class="row-text" @click=${() => this._activate(t)}>
          <div class="row-title">${t.name}</div>
          <div class="row-meta">${Yt(t)}</div>
        </div>
        ${!t.is_folder && this._permissions.allow_delete ? c`<ha-button
              title="Delete"
              @click=${() => this._deleteTarget = t}
            >
              <ha-icon icon="mdi:delete-outline"></ha-icon>
            </ha-button>` : h}
      </div>
    `;
  }
  _renderEditor() {
    return c`
      <ha-dialog
        .open=${this._editorOpen}
        .heading=${this._editorIsNew ? "New file" : "Edit file"}
        @closed=${() => this._editorOpen = !1}
      >
        ${this._editorIsNew ? c`<div class="filename">
              Saved in ${this._info?.scope ? this._info.scope : "the bucket root"}
            </div>` : c`<div class="filename">${this._editorData.path}</div>`}
        <ha-form
          .hass=${this.hass}
          .data=${this._editorData}
          .schema=${this._editorSchema()}
          .computeLabel=${(t) => this._editorLabels()[t.name] ?? t.name}
          @value-changed=${(t) => {
      this._editorData = t.detail.value;
    }}
        ></ha-form>
        ${this._editorError ? c`<div class="error">${this._editorError}</div>` : h}
        ${this._permissions.allow_write ? h : c`<div class="hint">
              Writing is switched off for this integration, so this file cannot
              be saved from here.
            </div>`}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" @click=${() => this._editorOpen = !1}>
            ${this._permissions.allow_write ? "Cancel" : "Close"}
          </ha-button>
          ${this._permissions.allow_write ? c`<ha-button
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
    return c`
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
Z.styles = _t`
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
    .filename {
      font-size: 13px;
      color: var(--secondary-text-color);
      padding-top: 4px;
    }
    .hint {
      font-size: 13px;
      color: var(--secondary-text-color);
      padding-top: 8px;
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
    }
  `;
let u = Z;
_([
  z({ attribute: !1 })
], u.prototype, "hass");
_([
  z({ type: Boolean })
], u.prototype, "narrow");
_([
  z({ attribute: !1 })
], u.prototype, "route");
_([
  z({ attribute: !1 })
], u.prototype, "panel");
_([
  $()
], u.prototype, "_info");
_([
  $()
], u.prototype, "_path");
_([
  $()
], u.prototype, "_entries");
_([
  $()
], u.prototype, "_loading");
_([
  $()
], u.prototype, "_error");
_([
  $()
], u.prototype, "_editorOpen");
_([
  $()
], u.prototype, "_editorIsNew");
_([
  $()
], u.prototype, "_editorData");
_([
  $()
], u.prototype, "_editorError");
_([
  $()
], u.prototype, "_saving");
_([
  $()
], u.prototype, "_deleteTarget");
function O(s) {
  return s instanceof Error ? s.message : String(s);
}
customElements.get("s3-files-panel") || customElements.define("s3-files-panel", u);
export {
  u as S3FilesPanel
};
