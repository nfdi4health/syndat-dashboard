export default class ScoreUtils {

  private static isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
  }

  static calculateAucScore(auc: number | null) {
    if (!this.isFiniteNumber(auc)) {
      return null;
    }
    if (auc < 0.5) {
      auc = 1 - auc
    }
    return Math.max(Math.floor((1 - auc) * 200), 1);
  }

  static calculateJsdScore(jsd: number | null) {
    if (!this.isFiniteNumber(jsd)) {
      return null;
    }
    return Math.floor((1 - jsd) * 100);
  }

  static calculateNormScore(norm: number | null) {
    if (!this.isFiniteNumber(norm)) {
      return null;
    }
    return (
      Math.floor(Math.abs(1 - norm) * 100)
    );
  }

  static calculatePrivacyScore(risk: number | null) {
    if (!this.isFiniteNumber(risk)) {
      return null;
    }
    return Math.floor((1 - risk) * 100);
  }

  static displayPrivacyScore(risk: number | null) {
    const score = this.calculatePrivacyScore(risk);
    return score === null ? null : 100 - score;
  }
}
