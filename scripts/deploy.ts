/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ExecOptions } from "child_process"
import { SettingsDao } from "../publish/SettingsDao"
import { Stage, TASK_DEPLOY_LAYER } from "./common"
import { asyncExec } from "./helper"
import { rm } from "shelljs"
import { ozNetworkFile } from "./common"

export async function deploy(stage: Stage, options?: ExecOptions): Promise<void> {
    const settings = new SettingsDao(stage)
    const layer2Network = settings.getNetwork("layer2")

    // test stage deploys only to layer2 and always restarts from initial version
    if ("test" === stage) {
        settings.setVersion("layer2", 0)
    }

    // remove .openzeppelin/${network}.json for the initial deploy
    if (0 === settings.getVersion("layer2")) {
        rm(`.openzeppelin/${ozNetworkFile[layer2Network]}.json`)
    }

    // Base contracts
    await asyncExec(`buidler --network ${layer2Network} ${TASK_DEPLOY_LAYER} ${stage} layer2 0`, options)

    // AMMs
    await asyncExec(`buidler --network ${layer2Network} ${TASK_DEPLOY_LAYER} ${stage} layer2 1`, options)

    // Transfer ownership
    await asyncExec(`buidler --network ${layer2Network} ${TASK_DEPLOY_LAYER} ${stage} layer2 2`, options)

    // Optional for clearing house verification
    //await asyncExec(
    //    `buidler --network ${layer2Network} --config buidler.flatten.clearinghouse.config.ts ${TASK_DEPLOY_LAYER} ${stage} layer2 4`,
    //    options,
    //)

    // Optional for amms verification
    //await asyncExec(
    //    `buidler --network ${layer2Network} --config buidler.flatten.amm.config.ts ${TASK_DEPLOY_LAYER} ${stage} layer2 5`,
    //    options,
    //)
}

/* eslint-disable no-console */
async function main(): Promise<void> {
    const stage = process.argv[2] as Stage
    await deploy(stage)
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error)
            process.exit(1)
        })
}
