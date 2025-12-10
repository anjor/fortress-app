// UK Tax Calculations for Fortress v2
// Simplified version focused on optimal extraction for Ltd company directors

export interface ExtractionResult {
  salary: number;
  dividends: number;
  corporationTax: number;
  incomeTax: number;
  nationalInsurance: number;
  dividendTax: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
}

/**
 * Calculate optimal salary/dividend split for company director
 * Uses 2024/25 tax rates
 */
export function calculateOptimalExtraction(grossRevenue: number): ExtractionResult {
  // Optimal strategy: £12,570 salary (NI threshold), rest as dividends
  const optimalSalary = 12570;
  
  // Corporation tax on profits
  const employerNI = calculateEmployerNI(optimalSalary);
  const deductibleCosts = optimalSalary + employerNI;
  const profits = Math.max(0, grossRevenue - deductibleCosts);
  
  const corporationTax = calculateCorporationTax(profits);
  const availableForDividends = profits - corporationTax;
  
  // Personal taxes
  const employeeNI = calculateEmployeeNI(optimalSalary);
  const incomeTax = calculateIncomeTax(optimalSalary);
  const dividendTax = calculateDividendTax(availableForDividends);
  
  const totalTax = corporationTax + incomeTax + employeeNI + dividendTax;
  const netIncome = grossRevenue - totalTax;
  
  return {
    salary: optimalSalary,
    dividends: availableForDividends,
    corporationTax,
    incomeTax,
    nationalInsurance: employeeNI + employerNI,
    dividendTax,
    totalTax,
    netIncome,
    effectiveRate: totalTax / grossRevenue,
  };
}

/**
 * Corporation tax with marginal relief
 */
function calculateCorporationTax(profits: number): number {
  if (profits <= 0) return 0;
  
  const smallProfitsRate = 0.19;
  const mainRate = 0.25;
  const lowerLimit = 50000;
  const upperLimit = 250000;
  
  if (profits <= lowerLimit) {
    return profits * smallProfitsRate;
  }
  
  if (profits >= upperLimit) {
    return profits * mainRate;
  }
  
  // Marginal relief formula
  const baseTax = profits * mainRate;
  const marginalRelief = ((upperLimit - profits) * (profits - lowerLimit)) / 
                         (upperLimit - lowerLimit) * 0.015;
  
  return baseTax - marginalRelief;
}

/**
 * Employee National Insurance
 */
function calculateEmployeeNI(salary: number): number {
  const primaryThreshold = 12570;
  const upperLimit = 50270;
  const mainRate = 0.12;
  const additionalRate = 0.02;
  
  if (salary <= primaryThreshold) return 0;
  
  if (salary <= upperLimit) {
    return (salary - primaryThreshold) * mainRate;
  }
  
  return (upperLimit - primaryThreshold) * mainRate + 
         (salary - upperLimit) * additionalRate;
}

/**
 * Employer National Insurance
 */
function calculateEmployerNI(salary: number): number {
  const secondaryThreshold = 9100;
  const rate = 0.138;
  
  if (salary <= secondaryThreshold) return 0;
  return (salary - secondaryThreshold) * rate;
}

/**
 * Income tax on salary
 */
function calculateIncomeTax(salary: number): number {
  const personalAllowance = salary > 100000 
    ? Math.max(0, 12570 - (salary - 100000) / 2)
    : 12570;
  
  const taxable = Math.max(0, salary - personalAllowance);
  
  const basicLimit = 37700;
  const higherLimit = 125140;
  
  let tax = 0;
  
  if (taxable <= basicLimit) {
    tax = taxable * 0.20;
  } else if (taxable <= higherLimit) {
    tax = basicLimit * 0.20 + (taxable - basicLimit) * 0.40;
  } else {
    tax = basicLimit * 0.20 + 
          (higherLimit - basicLimit) * 0.40 + 
          (taxable - higherLimit) * 0.45;
  }
  
  return tax;
}

/**
 * Dividend tax
 */
function calculateDividendTax(dividends: number): number {
  // £500 dividend allowance (2024/25)
  const allowance = 500;
  const taxable = Math.max(0, dividends - allowance);
  
  // Dividend rates (2024/25)
  const basicRate = 0.0875;
  const higherRate = 0.3375;
  const additionalRate = 0.3935;
  
  // Personal allowance already used by salary
  // So dividends start at basic rate
  const basicBand = 37700;
  const higherBand = 125140;
  
  let tax = 0;
  
  if (taxable <= basicBand) {
    tax = taxable * basicRate;
  } else if (taxable <= higherBand) {
    tax = basicBand * basicRate + (taxable - basicBand) * higherRate;
  } else {
    tax = basicBand * basicRate + 
          (higherBand - basicBand) * higherRate + 
          (taxable - higherBand) * additionalRate;
  }
  
  return tax;
}

/**
 * Calculate gross revenue needed to achieve target net income
 */
export function grossForNet(targetNet: number): number {
  // Binary search for gross that gives target net
  let low = targetNet;
  let high = targetNet * 2;
  
  while (high - low > 100) {
    const mid = (low + high) / 2;
    const result = calculateOptimalExtraction(mid);
    
    if (result.netIncome >= targetNet) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return Math.ceil(high);
}

export default calculateOptimalExtraction;
