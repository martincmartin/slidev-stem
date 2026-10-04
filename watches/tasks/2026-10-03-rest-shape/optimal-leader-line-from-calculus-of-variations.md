# Optimal leader line from calculus of variations

**Covers:** the endpoint path of a leader that touches an arbitrary moving outline.
**Read before:** replacing the current frame-by-frame leader selection with a path optimization.
**Task:** [rest shape](README.md). **Date:** 2026-10-04.

The endpoint must minimize a cost over the entire animation.
A minimum satisfies a differential equation and boundary conditions that depend on the full time interval.
Selecting the best point for the current frame does not, in general, satisfy those conditions.

This document derives the conditions for the requested squared perpendicular-velocity penalty.
It contains no implementation or numerical trial.
The derivations specific to the leader are new work here.

The current [watch rules](../../docs/watch.md) describe the existing leader selection.
The [measurements](../../docs/measurements.md) and [house legibility rules](../../../docs/legibility.md) cover the line's visibility.
This analysis does not change the line width, typography, timing, or existing animation.
The previous source and docs are saved in [the velocity task's inputs](normal-velocity/inputs/).

## 1. Define the moving outline and admissible paths

Let time run from $0$ to $T$, with the animation duration $T$ fixed.
Let $\Gamma_t$ be the outline at time $t$.
On a regular part of that outline, write

$$
\Gamma_t=\{X(s,t):s\in S\},\qquad X_s(s,t)\ne 0.
$$

Here, $s$ labels positions along the outline. It need not be arc length.
For a closed outline, use a periodic parameter and local coordinate charts.
The shape can be nonconvex and can have several outline components.

The unknown is a path $s(t)$, with endpoint

$$
q(t)=X(s(t),t),\qquad
\dot q=X_t+X_s\dot s.
$$

This is the velocity of the selected contact point on the screen.
It includes both shape deformation and movement of the contact along the outline.
Using only $X_t$ would measure a fixed material point and would omit contact sliding.
The total velocity is unchanged by a smooth change of outline coordinates.

Require $q(t)\in\Gamma_t$ at all times.
Use absolutely continuous paths with finite cost for the variational problem.
Their velocity exists almost everywhere. Classical equations apply where the path and geometry have enough derivatives.

Assume $X$ is $C^2$ for the classical first-order derivation below.
A merely $C^1$ deformation need not provide the derivatives of the integrand used in that equation.
The functional still applies, but the displayed equations require more regularity or suitable weak or generalized derivatives.
Continuity alone does not define a velocity or guarantee a differentiable optimal path.
The second-variation test requires two derivatives of the resulting integrand.

Smooth deformation does not imply that topology changes have a regular parametrization.
Treat corners, component junctions, and disappearing branches separately, as discussed in section 7.

## 2. Define the leader and its path cost

Keep the text-side start $a$ and elbow $e$ fixed, as in the current drawing.
The endpoint $q$ determines the final segment from $e$ to the ghost.
Define

$$
r=\lVert q-e\rVert,\qquad
u=\frac{q-e}{r},\qquad
n=(-u_y,u_x),\qquad
d=\frac{e-a}{\lVert e-a\rVert}.
$$

Require $r\ge r_{\min}>0$ and $a\ne e$.
These conditions keep both segment directions defined.
The vector $n$ is perpendicular to the leader, not necessarily to the outline.

Let $\phi$ be a locally continuous angle of $u$.
Let $\phi_d$ be the angle of $d$.
The unsigned bend penalty is

$$
B(\phi)=\arccos(d\cdot u)
=\left|\operatorname{wrap}_{[-\pi,\pi]}(\phi-\phi_d)\right|.
$$

It ranges from $0$ for a straight continuation to $\pi$ for a reversal.
It has kinks at those two configurations.
First derive the smooth equations away from the kinks; then apply section 7.

The requested velocity term is exactly

$$
w^2=(\dot q\times u)^2=(n\cdot\dot q)^2.
$$

The two signed expressions differ by a minus sign; their squares agree.
Since $e$ is fixed,

$$
\dot q=\dot r\,u+r\dot\phi\,n,
\qquad w=r\dot\phi.
$$

Thus, perpendicular velocity is angular velocity multiplied by segment length.
It is not angular velocity alone. Motion directly along the segment has zero velocity cost.

With positive weights $\alpha,\beta,\gamma$, minimize

$$
\boxed{
J[s]=\int_0^T
\left[\alpha r+\beta B(\phi)+\gamma r^2\dot\phi^2\right]dt
+\Phi(s(0))+\Psi(s(T)).
}
$$

The fixed segment length $\lVert e-a\rVert$ adds the same constant to every path, so omit it.
The optional functions $\Phi$ and $\Psi$ score initial and final placement.
They can be zero. A fixed endpoint is a constraint, rather than a large endpoint penalty.

This objective measures accumulated length, bend, and squared perpendicular speed over physical time.
If cost has an arbitrary unit $C$, the weights have these units:

| Weight   | Units                          |
| -------- | ------------------------------ |
| $\alpha$ | $C/(\mathrm{px}\,\mathrm{s})$  |
| $\beta$  | $C/(\mathrm{rad}\,\mathrm{s})$ |
| $\gamma$ | $C\,\mathrm{s}/\mathrm{px}^2$  |

Changing duration changes the trade-off even when the geometric deformation is the same.
For a duration stretch by a factor $k$, the static costs scale by $k$, and the velocity cost scales by $1/k$.
The former displacement weight therefore cannot retain its interpretation after this change of objective.
No new numerical weights are selected here.

## 3. Reduce the constraint to one unknown function

View $r$ and $\phi$ as functions of $(s,t)$ through $X(s,t)$.
Use partial derivatives with the other argument fixed.
Define

$$
A(s,t)=n\cdot X_t=r\phi_t,\qquad
H(s,t)=n\cdot X_s=r\phi_s,
$$

$$
U(s,t)=\alpha r+\beta B(\phi).
$$

For a possible outline-coordinate velocity $v$, the integrand is

$$
F(s,v,t)=U(s,t)+\gamma\left(A(s,t)+H(s,t)v\right)^2.
$$

Along the actual path, $v=\dot s$ and $w=A+H\dot s$.
This reduction enforces contact with the moving outline exactly.
It does not require a particular deformation, curvature, or convexity.

## 4. Derive the Euler–Lagrange condition

Perturb an admissible path by $s_\epsilon=s+\epsilon\eta$.
For fixed endpoints, choose $\eta(0)=\eta(T)=0$.
Differentiating the cost and integrating by parts gives

$$
\delta J
=\int_0^T\left(F_s\eta+F_v\dot\eta\right)dt
=\left[F_v\eta\right]_0^T
+\int_0^T\left(F_s-\frac{dF_v}{dt}\right)\eta\,dt.
$$

Every interior perturbation must give zero first variation.
Therefore,

$$
\boxed{\frac{d}{dt}F_v-F_s=0.}
$$

This is the standard Euler–Lagrange step.
See [Strang, section 7.2](https://math.mit.edu/classes/18.086/2006/am72.pdf).

For this leader,

$$
P:=F_v=2\gamma H w,
$$

$$
F_s=U_s+2\gamma w(A_s+H_s\dot s).
$$

Since $\dot H=H_t+H_s\dot s$, substitution gives

$$
2\gamma\left[H\dot w+(H_t-A_s)w\right]=U_s.
$$

Mixed derivatives of $\phi$ cancel, leaving

$$
H_t-A_s=r_t\phi_s-r_s\phi_t.
$$

Consequently, the necessary equation on each smooth interior interval is

$$
\boxed{
2\gamma\left[
r\phi_s\frac{d}{dt}\left(r(\phi_t+\phi_s\dot s)\right)
+(r_t\phi_s-r_s\phi_t)r(\phi_t+\phi_s\dot s)
\right]
=\alpha r_s+\beta B'(\phi)\phi_s.
}
$$

All quantities are evaluated at $(s(t),t)$.
The total derivative follows the selected contact path.
The term containing $\dot w$ includes $\ddot s$.
Its coefficient is $2\gamma H^2$.

Thus, where $H\ne0$, this is a second-order differential equation.
Its solution requires boundary data and the shape deformation across the entire time interval.
An instantaneous minimum of $F$ omits the term $dF_v/dt$ and generally gives a different path.

### A coordinate-independent form

Define the screen-space integrand

$$
\mathcal L(q,\dot q,t)
=\alpha\lVert q-e\rVert+\beta B(\phi(q))
+\gamma(n(q)\cdot\dot q)^2.
$$

An allowed interior perturbation of $q$ is tangent to the outline.
The residual must therefore have zero tangential component:

$$
\boxed{
X_s\cdot\left[
\frac{d}{dt}\mathcal L_{\dot q}-\mathcal L_q
\right]=0.
}
$$

The residual can have a component normal to the outline because contact is constrained.
If the outline is locally $G(q,t)=0$, with $\nabla_qG\ne0$, an equivalent form is

$$
\frac{d}{dt}\mathcal L_{\dot q}-\mathcal L_q
=\lambda(t)\nabla_qG,
\qquad G(q,t)=0.
$$

The sign of $\lambda$ follows this convention.
Differentiating contact also imposes

$$
\nabla_qG\cdot\dot q+G_t=0.
$$

The coordinate and multiplier forms describe the same constrained variation.
See [Liberzon, section 2.5.2.1](https://liberzon.csl.illinois.edu/teaching/cvoc/node40.html).

For a higher-dimensional surface, use one Euler–Lagrange equation for each local surface coordinate.
Replace $w^2$ with $\dot q^{\mathsf T}(I-uu^{\mathsf T})\dot q$.
The residual must be perpendicular to every allowed surface tangent.

## 5. Derive the endpoint conditions

Including the endpoint costs, the first variation's boundary terms are

$$
\bigl(P(T)+\Psi_s(s(T))\bigr)\eta(T)
+\bigl(\Phi_s(s(0))-P(0)\bigr)\eta(0).
$$

For free endpoints inside the allowed coordinate range, the conditions at fixed times are:

| Endpoint choice       | Necessary condition                        |
| --------------------- | ------------------------------------------ |
| Fixed initial contact | $s(0)=s_0$; no natural condition on $P(0)$ |
| Free initial contact  | $P(0)=\Phi_s$                              |
| Fixed final contact   | $s(T)=s_T$; no natural condition on $P(T)$ |
| Free final contact    | $P(T)=-\Psi_s$                             |

With no endpoint cost, a free endpoint gives $P=2\gamma H w=0$.
Where $H\ne0$, this requires zero perpendicular velocity at that endpoint.
It does not require zero total velocity: radial motion can remain.
Where $H=0$, the condition does not constrain $w$.

These are natural boundary conditions, obtained from the first variation.
For the terminal-cost boundary condition, see [Liberzon, section 3.4.2](https://liberzon.csl.illinois.edu/teaching/cvoc/node56.html).

For this slide, the short straight-board contact can remain fixed at the initial time.
The final contact can be free, fixed to a chosen spring point, or scored by a terminal cost.
Each choice defines a different optimization problem.
If the final spring remains visible for a specified hold duration, its static cost can supply that terminal cost.

A stationary hold after $T$ does not automatically impose $\dot q(T^-)=0$ in this first-order cost.
If continuous velocity into the hold is required, impose that condition separately and check that the deformation permits it.

## 6. An exact example shows why the future matters

Consider a stationary circular arc centered at the elbow, with radius $R$.
Measure angle from the straight leader direction.
Keep the endpoint on an arc with $0<\phi<\phi_{\max}<\pi$.
Fix $\phi(0)=\phi_0$ and leave the final angle free.

Within this arc, $B(\phi)=\phi$, and

$$
J=\int_0^T\left[\alpha R+\beta\phi+\gamma R^2\dot\phi^2\right]dt.
$$

The interior equation and free final condition give

$$
2\gamma R^2\ddot\phi=\beta,
\qquad \dot\phi(T)=0.
$$

The solution is

$$
\boxed{
\phi(t)=\phi_0+\frac{\beta}{4\gamma R^2}(t^2-2Tt),
\qquad
\dot\phi(t)=-\frac{\beta}{2\gamma R^2}(T-t).
}
$$

Require $\phi_0>\beta T^2/(4\gamma R^2)$ so that the solution stays inside the positive-angle arc.
The initial speed depends on the future duration $T$.
The path starts moving immediately and slows toward the final contact.
Even this stationary shape requires a decision based on the whole interval.

In this restricted example, the objective is convex and the velocity term is strictly convex.
With the fixed initial angle, this feasible solution is the unique global minimum.
No numerical example or spike is needed for this result.

## 7. Extend the conditions to nonsmooth or restricted contact

### Straight bends and reversals

The exact unsigned bend angle is not differentiable everywhere.
Near a straight bend, write $B=|\phi-\phi_d|$.
At alignment, use a subgradient $\zeta\in[-1,1]$ instead of $B'$.
The Euler–Lagrange equation becomes an inclusion with $\beta\zeta\phi_s$ on its right side.

At a reversal, use the corresponding one-sided derivatives or generalized derivative of the periodic angle penalty.
Alternatively, a smooth bend penalty can define a different problem.
For example, $1-d\cdot u$ is smooth but is not the requested linear angle penalty.
No replacement is selected here.

### Limits on allowed contact

The geometric outline can contain portions that should not receive a leader.
Examples include hidden edges or contacts whose final segment crosses the shape first at another point.
If these restrictions matter, include them in the admissible set.
The basic cost alone does not enforce them.

At an active limit, use the variational inequality

$$
\delta J[\eta]\ge0
\quad\text{for every feasible one-sided perturbation }\eta.
$$

The unrestricted interior equality applies only where both perturbation directions are allowed.
For smooth pointwise inequalities $g_j(s,t)\le0$, multipliers satisfy

$$
F_s-\dot P+\sum_j\mu_j(g_j)_s=0,
\qquad \mu_j\ge0,
\qquad \mu_jg_j=0.
$$

These formulas assume a constraint qualification and smooth active constraints.

### Temporal corners and outline branches

A contact path cannot jump between separate components while remaining continuous on the outline.
A self-intersection or component junction needs an explicit rule for whether branch changes are allowed.
If branch changes are allowed, compare complete feasible paths through those junctions.

For a strong minimum with a freely located temporal corner inside one smooth chart, both quantities must match across the corner:

$$
P^- =P^+,
\qquad
(F-\dot sP)^-=(F-\dot sP)^+.
$$

These are the Weierstrass–Erdmann conditions.
They follow from variations of the contact at the corner and of its time.
See [Liberzon, section 3.1.1](https://liberzon.csl.illinois.edu/teaching/cvoc/node47.html).

At a prescribed junction time, only allowed variations apply; a free-time condition must not be imposed automatically.
At a geometric corner of the outline, its tangent changes and a single smooth-chart equation is insufficient.
Use the allowed tangent directions and junction constraints in the first variation.

## 8. Test whether a stationary path is a minimum

The Euler–Lagrange equation finds stationary paths. It does not establish global optimality.
Define $\delta^2J$ as the second derivative of $J[s+\epsilon\eta]$ at $\epsilon=0$.
For a smooth stationary path, every admissible perturbation must also satisfy

$$
\boxed{
\delta^2J[\eta]
=\int_0^T\left[
F_{ss}\eta^2+2F_{sv}\eta\dot\eta+F_{vv}\dot\eta^2
\right]dt
+\Phi_{ss}\eta(0)^2+\Psi_{ss}\eta(T)^2
\ge0.
}
$$

Fixed endpoints remove the corresponding endpoint terms.
The necessary Legendre condition is

$$
F_{vv}=2\gamma H^2\ge0.
$$

It always holds here, but it is strict only where $H\ne0$.
The standard second-variation and Legendre tests are described in [Liberzon, section 2.6.1](https://liberzon.csl.illinois.edu/teaching/cvoc/node42.html).
For fixed endpoints, integration by parts rewrites the second variation as

$$
\delta^2J=\int_0^T
\left[K\dot\eta^2+Q\eta^2\right]dt,
\qquad
K=2\gamma H^2,
\qquad
Q=F_{ss}-\frac{d}{dt}F_{sv}.
$$

The associated Jacobi equation is

$$
-\frac{d}{dt}(K\dot\eta)+Q\eta=0.
$$

Where $K>0$, a nonzero solution vanishing at $0$ and an interior time defines a conjugate point.
Such an interior conjugate point rules out a weak local minimum under the classical smoothness assumptions.
A conjugate point at $T$ requires further analysis.
Free endpoints require the corresponding boundary conditions, rather than this fixed-endpoint test.
See [Cristoferi, sections 8.2–8.3](https://www.math.cmu.edu/~rcristof/pdf/Teaching/Spring2016/Cristoferi-Calculus_of_Variations-Lecture%20notes.pdf).

The Weierstrass excess for a competing coordinate velocity $\widetilde v$ is particularly simple:

$$
\begin{aligned}
E(s,v,\widetilde v,t)
&=F(s,\widetilde v,t)-F(s,v,t)-F_v(s,v,t)(\widetilde v-v)\\
&=\gamma H^2(\widetilde v-v)^2\ge0.
\end{aligned}
$$

This necessary condition for a strong minimum also holds automatically.
It tests velocity changes at a given contact, not distant contact paths or other branches.
See [Liberzon, section 3.1.2](https://liberzon.csl.illinois.edu/teaching/cvoc/node48.html).

For an arbitrary moving outline, $F$ need not be convex jointly in $(s,v)$.
Several stationary paths can pass the local tests and still have different total costs.
A global minimum must have no greater cost than every admissible competing path, including paths on other reachable branches.
Necessary conditions alone cannot certify that comparison.

## 9. The perpendicular-only penalty can be degenerate

The important quantity is

$$
H=n\cdot X_s.
$$

When the outline tangent is parallel to the leader, $H=0$.
Sliding along that tangent does not change perpendicular velocity to first order.
The cost then loses its quadratic control of $\dot s$, and the classical equation can lose its second-order term.

For example, on a stationary radial segment, $A=H=0$.
Every radial speed has zero velocity cost.
Only the static length cost selects a contact; the motion penalty does not make the transition slow.

Thus, the requested term can reduce transverse motion without limiting all endpoint speed.
It cannot, by itself, guarantee bounded radial speed, a unique path, or existence of a minimum for every arbitrary deformation.
Smooth shape motion alone is insufficient to claim those properties.

For a useful sufficient existence setting, take a compact allowed coordinate interval, regular data, and compatible endpoint constraints.
Also require $|H|\ge h_0>0$ throughout that admissible region.
Then the velocity term controls $\dot s$ quadratically.
Together with bounded $A$ and continuous bounded static costs, this supports the usual direct-method existence argument in $H^1$.
It still does not establish uniqueness.

If such geometric bounds are unavailable, additional assumptions can restore control.
These options change the problem and need a separate decision:

| Rank for this request | Formulation                                                          | Benefit                                                                    | Limitation                                                                      |
| --------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1                     | Exact perpendicular penalty, with explicit admissibility assumptions | Preserves the requested movement measure                                   | Degenerate regions require analysis; no universal uniqueness or existence claim |
| 2                     | Exact penalty plus a finite bound on total endpoint speed            | Keeps the objective unchanged and limits radial motion                     | Adds a hard constraint; it can make a deformation infeasible                    |
| 3                     | Add $\varepsilon\lVert\dot q\rVert^2$, with $\varepsilon>0$          | Penalizes radial motion and restores velocity control for regular geometry | Changes the objective and needs another weight                                  |

Use rank 1 for this derivation because it matches the request exactly.
Ranks 2 and 3 are possible extensions if a later application requires speed bounds or stronger existence guarantees.

## 10. Consequences for a later leader implementation

The mathematical unknown is the whole contact path $s:[0,T]\to S$.
The required data are the full deformation, allowed contacts, weights, and endpoint conditions.
On regular interior intervals, the path must satisfy the derived Euler–Lagrange equation.
It must also satisfy contact constraints, endpoint conditions, and any applicable kink or junction conditions.

The second variation and branch comparisons distinguish a minimum from a stationary candidate.
The perpendicular penalty's degeneracy must be checked before claiming existence, uniqueness, or smooth motion.
The original curl remains available in the task snapshots.
No source code, generated drawing, numerical spike, or animation was changed for this analysis.
