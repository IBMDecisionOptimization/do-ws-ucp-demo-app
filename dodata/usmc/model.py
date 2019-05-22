import docplex.mp
import pandas as pd


def dateFromStringToInt(input):
    from datetime import date
    year = input[0:4]
    month = input[5:7]
    day = input[8:10]
    return date(int(year), int(month), int(day)).toordinal()

df = inputs["unitTypes"]
df['schedFixedDate'] = [dateFromStringToInt(x) for x in df['schedFixedDate'].values]
df = inputs["requirements"]
df['startDate'] = [dateFromStringToInt(x) for x in df['startDate'].values]
df['endDate'] = [dateFromStringToInt(x) for x in df['endDate'].values]
df = inputs["units"]
df['lastStartDate'] = [dateFromStringToInt(x) for x in df['lastStartDate'].values]
df['lastEndDate'] = [dateFromStringToInt(x) for x in df['lastEndDate'].values]



dateFromStringToInt("2017-07-10")

commands = [t for t in inputs["commands"].itertuples(index=False)]
requirements = [t for t in inputs["requirements"].itertuples(index=False)]
mttr = [t for t in inputs["mttr"].itertuples(index=False)]
assignmentCompatibilityRules = [t for t in inputs["assignmentCompatibilityRules"].itertuples(index=False)]
currentSchedule = [t for t in inputs["currentSchedule"].itertuples(index=False)]
taskForces = [t for t in inputs["taskForces"].itertuples(index=False)]
units = [t for t in inputs["units"].itertuples(index=False)]
unitTypes = [t for t in inputs["unitTypes"].itertuples(index=False)]

print(unitTypes)

excludedDeployment = [t for t in inputs["excludedDeployment"].itertuples(index=False)]
fixedDeployment = [t for t in inputs["fixedDeployment"].itertuples(index=False)]

from collections import namedtuple

TArc = namedtuple("TArc", ["startNode", "endNode"])
TUA = namedtuple("TUA", ["unit", "startNode", "endNode"])

TUnitRequirementKeyed = namedtuple("TUnitRequirementKeyed", ["unit", "requirement"])
TUnitRequirementString = namedtuple("TUnitRequirementString", ["unit", "requirement"])

for r in requirements:
    assert r.endDate > r.startDate , "requirement table is bad"

terminal = "termination"
R  = {r.reqName for r in requirements}
U  = {u.unitCode for u in units}
N =  U | R | {terminal}

assignableRequirements = {r for r in requirements for t in unitTypes if r.startDate > t.schedFixedDate and t.unitType == "ACTIVE"}
AR = {r.reqName for r in assignableRequirements}

#/* Number of units needed for each requirement */
numberRequired = {r.reqName : r.unitsReq for r in requirements}
#/* Criticality factor for each requirement */
criticalFac = {r.reqName : r.criticality for r in requirements}

currentScheduleModified  = {TUnitRequirementString(s.unit, s.req) for s in currentSchedule}
preservedSchedule =set()

UR = set()
assignmentPriority = {ur : 0 for ur in UR}
sources  = { u : "dummy" for  u in U}

#/* Create arcs in the network */
initialArcs = {TArc(u, n) for u in U for n in N if n not in U}
netArcs = {TArc(i, j)  for i in R for j in R if i != j}
termArcs  = {TArc(r,terminal) for r in R}

#/* Create unit and arc combinations */
ua_initial = {TUA(u, u, terminal) for  u in U }
ua_internal = set()
ua_terminal = {TUA(u, t.startNode, t.endNode) for u in U for t in termArcs}



#// union of Arcs and unit-arcs
allArcs = initialArcs | netArcs | termArcs

#// Penalty associate with the arc

penaltyArc = {arc : 0.0 for arc in allArcs}

# 	// Build the source nodes based on schedule fix period
taskForces_dict = {t.taskForce : t.unitType for t in taskForces}
TunitTypes_dict = namedtuple("TunitTypes_dict", ["unitType","minDwell","desiredDwell","schedFixedDate"])
unitTypes_dict =  {unitType : TunitTypes_dict(unitType, minDwell,desiredDwell,schedFixedDate) for (unitType, minDwell,desiredDwell,schedFixedDate) in unitTypes}

# // Build the arcs from units directly to requirements
TassignmentCompatibilityRules_dict = namedtuple("TassignmentCompatibilityRules_dict", ["taskForce","command","assignmentPriority"])
assignmentCompatibilityRules_dict = {(taskForce,command) : TassignmentCompatibilityRules_dict(taskForce,command,assignmentPriority) for (taskForce,command,assignmentPriority) in assignmentCompatibilityRules}
Tmttr_dict = namedtuple("Tmttr_dict", ["startReadiness","targetReadiness","duration"])
mttr_dict = {(startReadiness,targetReadiness) : Tmttr_dict(startReadiness,targetReadiness,duration) for (startReadiness,targetReadiness,duration) in mttr}
Trequirements_dict = namedtuple("Trequirements_dict", ["reqName","reqType","command","startDate","endDate","readinessReq","finishReadiness","unitsReq","criticality"])
requirements_dict = {reqName : Trequirements_dict(reqName, reqType,command,startDate,endDate,readinessReq,finishReadiness,unitsReq,criticality) for (reqName,reqType,command,startDate,endDate,readinessReq,finishReadiness,unitsReq,criticality) in requirements}


for u in units:
    criticalDate = unitTypes_dict.get(taskForces_dict.get(u.taskForce)).schedFixedDate
    lastCurrentStart = u.lastStartDate
    #lastEnd = u.lastEndDate
    #lastReadiness = u.finishedReadiness
    lastReq = "x"

    #// update last fixed assignment:
    for p in currentSchedule:
        if p.unit == u.unitCode:
            r = p.req
            startD = requirements_dict[r].startDate
            if startD < criticalDate and startD >= lastCurrentStart:
                lastCurrentStart = startD#r.startDate
                #lastEnd = r.endDate;
                #lastReadiness = r.finishReadiness;
                lastReq = r

                preservedSchedule.add(TUnitRequirementString(u.unitCode, r))
                currentScheduleModified.remove(TUnitRequirementString(u.unitCode, r))
                numberRequired[r] -=1 # // Updatetoreflectremainingrequirement

    if lastReq != "x":
        sources[u.unitCode] =lastReq



for j in assignableRequirements:
    for u in units:
        if assignmentCompatibilityRules_dict.get((u.taskForce, j.command), None) is not None:
            lastEnd = u.lastEndDate
            lastStart = u.lastStartDate
            lastReadiness = u.finishedReadiness
            sourceReq = sources[u.unitCode]

            UR.add(TUnitRequirementString(u.unitCode, j.reqName))
            if sourceReq != "dummy":
                lastEnd = requirements_dict.get(sourceReq).endDate
                lastStart = requirements_dict.get(sourceReq).startDate
                lastReadiness = requirements_dict.get(sourceReq).finishReadiness

            dwellTimeIndex = j.startDate - lastEnd
            arcDwellRatio = (dwellTimeIndex+0.0) / (lastEnd - lastStart)
            dwellMTTRRequired = mttr_dict.get((lastReadiness, j.readinessReq)).duration
            MTTR_toOne = mttr_dict.get((lastReadiness, 1)).duration
            unit = unitTypes_dict.get(taskForces_dict.get(u.taskForce))
            minDwell = unit.minDwell
            bestDwell = unit.desiredDwell

            if arcDwellRatio >= minDwell and dwellTimeIndex >= dwellMTTRRequired:
                #print(arcDwellRatio)
                #print(minDwell)
                #print(dwellTimeIndex)
                #print(dwellMTTRRequired)
                a = (u.unitCode, j.reqName)# initialArcs.get(u.unitCode, j.reqName)
                ua_initial.add(TUA(u.unitCode, a[0], a[1]))

                #print(TUA(u.unitCode, a[0], a[1]))

                #// Penalty of the arc is set to range from 0 to 10, and the penalty is 0 only if it meets the desired dwell and at the readiness 1.
                penaltyArc[a] =  pow(  (bestDwell+0.0) / min(bestDwell, arcDwellRatio), 2.0 )


                if (dwellTimeIndex >= MTTR_toOne):
                    penaltyArc[a] = penaltyArc[a] - 0.5

for j in assignableRequirements:
    for u in units:
        x = assignmentCompatibilityRules_dict.get((u.taskForce, j.command), None)
        if x is not None :
            assignmentPriority[(u.unitCode, j.reqName)] = 10-x.assignmentPriority;

for i in assignableRequirements:
    for j in assignableRequirements:
        if i != j and j.startDate > i.endDate:
            for u in units:
                xi = assignmentCompatibilityRules_dict.get((u.taskForce, j.command), None)
                xj = assignmentCompatibilityRules_dict.get((u.taskForce, i.command), None)
                if xi is not None and xj is not None:
                    dwellTimeIndex = j.startDate - i.endDate
                    arcDwellRatio = (dwellTimeIndex+0.0) / (i.endDate - i.startDate)
                    dwellMTTRRequired = mttr_dict.get((i.finishReadiness, j.readinessReq)).duration
                    MTTR_toOne = mttr_dict.get((lastReadiness, 1)).duration
                    unit = unitTypes_dict.get(taskForces_dict.get(u.taskForce))
                    minDwell = unit.minDwell
                    bestDwell = unit.desiredDwell

                    if arcDwellRatio >= minDwell and dwellTimeIndex >= dwellMTTRRequired:
                        b = (i.reqName, j.reqName)
                        ua_internal.add(TUA(u.unitCode, b[0], b[1]))

                        #// Penalty of the arc is set to range from 0 to 10, and the penalty is 0 only if it meets the desired dwell and at the readiness 1.
                        penaltyArc[b] =  pow(  (bestDwell+0.0) / min(bestDwell, arcDwellRatio), 2.0 )
                        if dwellTimeIndex >= MTTR_toOne:
                            penaltyArc[b] = penaltyArc[b] - 0.5


UA = ua_initial | ua_internal | ua_terminal

print(len(ua_initial))
print(len(UA))


from docplex.mp.model import Model
mdl = Model("model")

#/* Decision Variables */
x = mdl.binary_var_dict(UA, name="x")
y = mdl.binary_var_dict(currentScheduleModified, name="y")
z = mdl.integer_var_dict(AR, lb = 0, name="z")
w = mdl.binary_var_dict(UR, name="w")

missionRisk = mdl.sum(criticalFac[r] * z[r] for r in AR)
forcesRisk = mdl.sum(penaltyArc[(ua.startNode, ua.endNode)] * x[ua] for ua in UA)


planRisk = mdl.sum(y[d] for d in currentScheduleModified)
comptabilityRisk = mdl.sum(assignmentPriority[ur] * w[ur] for ur in UR)

mdl.add_kpi(missionRisk, "missionRisk")
mdl.add_kpi(forcesRisk, "forcesRisk")
mdl.add_kpi(planRisk, "planRisk")
mdl.add_kpi(comptabilityRisk, "comptabilityRisk")

mdl.minimize(10000 * missionRisk + 100 * forcesRisk + 1 * planRisk + 0.01*comptabilityRisk)

TUA = namedtuple("TUA", ["unit", "startNode", "endNode"])
UA_by_unit = { unit : [] for (unit,startNode,endNode) in UA}
myunits = {unit for (unit,startNode,endNode) in UA}
mystarts = {startNode for (unit,startNode,endNode) in UA}
myends = {endNode for (unit,startNode,endNode) in UA}
UA_by_unit_by_start = { unit : {startNode : [] for startNode in mystarts} for unit in myunits}
UA_by_unit_by_end = { unit : {endNode : [] for endNode in myends} for unit in myunits}

for t in UA:
    UA_by_unit[t.unit].append(t)
    UA_by_unit_by_start[t.unit][t.startNode].append(t)
    UA_by_unit_by_end[t.unit][t.endNode].append(t)


cts = []
for (u,r) in UR:
    ex = mdl.sum(x[(unit,startNode,endNode)]  for (unit,startNode,endNode) in UA_by_unit[u] if endNode == r)
    cts.append(ex <= w[(u,r)])
mdl.add_constraints(cts)
print(len(cts))
mdl.print_information()

#/ *1.Unit schedule constraints: every unit must flow through thenetwork * /
cts = []
print(len(U))
for u in U:
    ex = mdl.sum(x[ua] for ua in ua_initial if ua.unit == u)
    cts.append(ex == 1)
mdl.add_constraints(cts)#, "unitsFlow")
print(len(cts))
mdl.print_information()

#/ *2. Deployment flow balance constraints: each unit enter and leave a requirement equal number of times * /
cts = []
for u in U:
    for r in R:
        #my_units = UA_by_unit[u]
        ex1 = mdl.sum(x[ua] for ua in UA_by_unit_by_end.get(u, {}).get(r, []))
        ex2 = mdl.sum(x[ub] for ub in UA_by_unit_by_start.get(u, {}).get(r, []))
        cts.append(ex1 == ex2)
mdl.add_constraints(cts)#, "balanced")
mdl.print_information()
print(len(cts))


#/ *3. Assignment balance constraints * / calc_under:
cts = []
for r in AR:
    ex = mdl.sum(x[ua] for ua in UA if ua.endNode == r)
    cts.append(ex+ z[r] == numberRequired[r])
mdl.add_constraints(cts)#, "calc_under")
mdl.print_information()
print(len(cts))

#/ *4. Plan disruption constraints * / plan_change:
cts = []
for d in currentScheduleModified:
    ex = mdl.sum(x[ua] for ua in  UA_by_unit_by_end.get(d.unit, {}).get(d.requirement, []) )
    cts.append(ex + y[d] == 1)
mdl.add_constraints(cts)#, "plan_change")
mdl.print_information()
print(len(cts))

#/ *5. Excluded deployment constraints * /
##useless?

cts = []
for f in fixedDeployment:
    ex = mdl.sum(x[ua] for ua in UA_by_unit_by_end.get(f.unit, {}).get(f.req, []))#   UA_by_unit[f.unit] if ua.endNode == f.req.reqName)
    cts.add(ex == 1)
mdl.add_constraints(cts)
mdl.print_information()

#/ *6. Fixed deployment constraints * /
#cts = []
##useless?
for e in excludedDeployment:
    ex = mdl.sum(x[ua] for ua in UA_by_unit_by_end.get(e.unit, {}).get(e.req, [])) #UA if ua.unit == e.unit.unitCode and ua.endNode == e.req.reqName)
    cts.append(ex == 0)
mdl.add_constraints(cts)
mdl.print_information()

mdl.solve(log_output=True)
#mdl.export_as_lp("speed.lp")
mdl.report()

Tunits_dict = namedtuple("Tunits_dict", ["unitCode","unitName","taskForce","lastStartDate","lastEndDate","finishedReadiness"])

units_dict = {t.unitCode : Tunits_dict(t.unitCode,t.unitName,t.taskForce,t.lastStartDate,t.lastEndDate,t.finishedReadiness) for t in units}

updatedSchedule = [(units_dict[s.unit], requirements_dict[s.requirement]) for s in preservedSchedule]
assignmentStats = []
for a in UA:
    if int(x[a]) == 1 and a.endNode != "termination":
        updatedSchedule.append((units_dict[a.unit], requirements_dict[a.endNode]))

        dwellTD = 0.0;
        dwellTR = 0.001;
        finishReadiness = 3;
        deploymentReadiness = 0

        my_start = requirements_dict.get(a.startNode, None)
        my_end = requirements_dict.get(a.endNode, None)
        if my_start is not None: #  				// req to req type of arc
            dwellTD = my_end.startDate - my_start.endDate
            dwellTR = (dwellTD+0.0) / (my_start.endDate  - my_start.startDate)
            finishReadiness = my_start.finishReadiness
            #print("Requirement to Requirement: "+str() a, ", ", dwellTD, ", ", dwellTR, ", ", dwellTR, ", ", finishReadiness);
        else: #			// source node to req
            if (sources.get(a.unit) != "dummy"):	#	// the source node was set at a req which was placed in preserved sched
                r = sources.get(a.unit)
                my_req = requirements_dict.get(r)
                dwellTD = my_end.startDate - my_req.endDate
                dwellTR = (dwellTD+0.0) / (my_req.endDate  - my_req.startDate)
                finishReadiness = my_req.finishReadiness
                #writeln("Unit to Requirement (T1): ", a, ", ", dwellTD, ", ", dwellTR, ", ", dwellTR, ", ", finishReadiness);
            else: 		#from unit's last req data to a req
                u = units_dict.get(a.unit);
                dwellTD = my_end.startDate - u.lastEndDate
                dwellTR = (dwellTD+0.0) / (u.lastEndDate  - u.lastStartDate)
                finishReadiness = u.finishedReadiness
                #writeln("Unit to Requirement (T2): ", a, ", ", dwellTD, ", ", dwellTR, ", ", dwellTR, ", ", finishReadiness );


        #/* Determine the deployment re adine ss */
        for i in range(1, 6):
            xx = mttr_dict.get((finishReadiness, i), None)
            if xx is not None and xx.duration <= dwellTD:
                deploymentReadiness = i;
                break;

        assignmentStats.append((units_dict.get(a.unit), my_end, dwellTD,
                               dwellTR, deploymentReadiness, my_end.startDate))

for i,t in enumerate(assignmentStats):
    t = (i,)+t
    assignmentStats[i] = t #tuples are immutable. need to update the $%# table...

for i,t in enumerate(updatedSchedule):
    t = (i,)+t
    updatedSchedule[i] = t



def unpack(df, dates=[]):
    def dateFromIntToString(input):
        from datetime import date
        mydata = date.fromordinal(input)
        return mydata.isoformat()

    ret = []
    for t in df:
        ii = 0
        tt = []
        for x in t:
            try:
                for y in x:
                    if ii in dates:
                        tt.append(dateFromIntToString(y))
                    else:
                        tt.append(y)
                    ii += 1
            except:
                if ii in dates:
                    tt.append(dateFromIntToString(x))
                else:
                    tt.append(x)
                ii += 1
        ret.append(tuple(tt))
    return ret

colsNames = ["ID","unitCode","unitName","taskForce","lastStartDate",
             "lastEndDate","finishedReadiness","reqName","reqType","command","startDate","endDate",
             "readinessReq","finishReadiness","unitsReq","criticality"]

updatedSchedule = unpack(df=updatedSchedule, dates=[4,5,10,11])
assignmentStats = unpack(df=assignmentStats, dates=[4,5,10,11,19])

outputs["updatedSchedule"] = pd.DataFrame(updatedSchedule, columns=colsNames)
outputs["assignmentStats"] = pd.DataFrame(assignmentStats, columns=colsNames+["dwellTD","dwellTR","deploymentReadiness","req_startDate"])

