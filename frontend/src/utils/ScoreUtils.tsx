export default class ScoreUtils {

  static calculateAucScore(auc: number) {
    if (auc < 0.5) {
      auc = 1 - auc
    }
    return Math.max(Math.floor((1 - auc) * 200), 1);
  }

  static calculateJsdScore(jsd: number) {
    return Math.floor((1 - jsd) * 100);
  }

  static calculateNormScore(norm: number) {
    return (
      Math.floor(Math.abs(1 - norm) * 100)
    );
  }

  static calculatePrivacyScore(risk: number) {
    return Math.floor((1 - risk) * 100);
  }
}
