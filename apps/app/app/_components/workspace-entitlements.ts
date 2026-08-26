import {
  isPaidTier,
  resolveWorkspaceFeatureAccess,
  subscriptionCatalog,
  workspaceFeatureEntitlement,
  type BusinessVerificationStatus,
  type SubscriptionTier,
  type WorkspaceFeature,
  type WorkspaceFeatureAccess
} from "@exporthq/authorization";

export type WorkspaceAccessIndicator = "eye" | "gem" | "shield" | null;

export interface WorkspaceEntitlementPresentation {
  routeAccess: WorkspaceFeatureAccess;
  displayAccess: WorkspaceFeatureAccess;
  indicator: WorkspaceAccessIndicator;
  category: string | null;
  message: string | null;
  requiredTierName: string;
  premium: boolean;
  fullDepth: boolean;
}

export function describeWorkspaceEntitlement(input: {
  authenticated: boolean;
  businessVerification: BusinessVerificationStatus;
  feature: WorkspaceFeature;
  isPlatformAdmin?: boolean;
  tier: SubscriptionTier;
}): WorkspaceEntitlementPresentation {
  const routeAccess = resolveWorkspaceFeatureAccess({
    authenticated: input.authenticated,
    feature: input.feature,
    tier: input.tier
  });
  const entitlement = workspaceFeatureEntitlement(input.feature);

  if (!entitlement) {
    if (routeAccess === "full") {
      return {
        routeAccess,
        displayAccess: routeAccess,
        indicator: null,
        category: null,
        message: null,
        requiredTierName: subscriptionCatalog[input.tier].name,
        premium: false,
        fullDepth: true
      };
    }
    return {
      routeAccess,
      displayAccess: routeAccess,
      indicator: routeAccess === "preview" ? "eye" : "gem",
      category: routeAccess === "preview" ? "Interactive preview" : "Premium feature",
      message: routeAccess === "preview"
        ? "Explore a safe sample of this workflow before creating or upgrading your workspace."
        : "Open plans to see the access level required for this capability.",
      requiredTierName: subscriptionCatalog[input.tier].name,
      premium: routeAccess === "locked",
      fullDepth: false
    };
  }

  const requiredTierName = subscriptionCatalog[entitlement.minimumTier].name;
  if (entitlement.kind === "trust") {
    const verified = input.businessVerification === "verified";
    const fullDepth = input.authenticated && (verified || isPaidTier(input.tier) || Boolean(input.isPlatformAdmin));
    if (fullDepth) {
      const includedByPlan = isPaidTier(input.tier) || Boolean(input.isPlatformAdmin);
      return {
        routeAccess,
        displayAccess: "full",
        indicator: includedByPlan ? "gem" : "shield",
        category: includedByPlan ? "Your premium access · Active" : "Your premium access · Verified business",
        message: input.isPlatformAdmin
          ? "This complete capability belongs to your platform administrator workspace."
          : includedByPlan
            ? `This complete capability is part of your ${subscriptionCatalog[input.tier].name} workspace.`
            : "This complete capability belongs to your workspace through its verified-business status.",
        requiredTierName,
        premium: true,
        fullDepth: true
      };
    }

    return {
      routeAccess,
      displayAccess: "preview",
      indicator: "gem",
      category: "Premium preview · Unlock full access",
      message: input.authenticated
        ? `You are using the limited view. Verify this business or activate ${requiredTierName} to unlock full depth.`
        : `This is a safe public view. Create an account, then verify the business or activate ${requiredTierName} for full depth.`,
      requiredTierName,
      premium: true,
      fullDepth: false
    };
  }

  if (routeAccess === "full") {
    return {
      routeAccess,
      displayAccess: "full",
      indicator: "gem",
      category: "Your premium access · Active",
      message: input.isPlatformAdmin
        ? "This capability belongs to your platform administrator workspace."
        : `This capability is part of your ${subscriptionCatalog[input.tier].name} workspace.`,
      requiredTierName,
      premium: true,
      fullDepth: true
    };
  }

  return {
    routeAccess,
    displayAccess: routeAccess,
    indicator: "gem",
    category: routeAccess === "preview" ? "Premium preview · See what is possible" : "Premium feature · Ready to unlock",
    message: input.authenticated
      ? `${requiredTierName} unlocks saved records, organization data, and actions.`
      : `Create a free account to explore more. ${requiredTierName} unlocks organization data and actions.`,
    requiredTierName,
    premium: true,
    fullDepth: false
  };
}
